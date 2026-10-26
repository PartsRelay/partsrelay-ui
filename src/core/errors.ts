import { isAxiosError } from 'axios'
import { kebabCase } from 'change-case'
import { getReasonPhrase } from 'http-status-codes'
import type { ErrorBody, FieldError } from '@/core/api/models'
import { message } from '@/core/message'
import { i18n } from '@/i18n'

export type { ErrorBody, FieldError }

export const NO_STATUS = 0

const SESSION_CODES = ['unauthorized', 'unauthorized-access']

const GONE_CODES = ['row-not-found', 'member-not-found', 'invitation-not-found']

const NETWORK_ERROR: ErrorBody = {
  code: 'network-error',
  status: NO_STATUS,
  message: 'Network Error',
}

function statusBody(status: number): ErrorBody {
  try {
    const reason = getReasonPhrase(status)

    return { code: kebabCase(reason), status, message: reason }
  } catch {
    return { code: 'unknown-error', status, message: 'Unknown Error' }
  }
}

export function statusCode(status: number) {
  return statusBody(status).code
}

function nonEmpty(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

function fromResponse(status: number, data: unknown): ErrorBody {
  const body: Partial<Record<keyof ErrorBody, unknown>> =
    typeof data === 'object' && data !== null ? data : {}
  const fallback = statusBody(status)
  const error = {
    code: nonEmpty(body.code) ?? fallback.code,
    status,
    message: nonEmpty(body.message) ?? fallback.message,
  }

  return Array.isArray(body.fields) && body.fields.length > 0
    ? { ...error, fields: body.fields as FieldError[] }
    : error
}

function isAuthClientError(error: unknown): error is { status: number; error: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'status' in error &&
    typeof error.status === 'number'
  )
}

export function toErrorBody(error: unknown): ErrorBody {
  if (isAxiosError(error)) {
    return error.response ? fromResponse(error.response.status, error.response.data) : NETWORK_ERROR
  }
  if (error instanceof Response) return statusBody(error.status)
  if (isAuthClientError(error)) return fromResponse(error.status, error.error)
  if (error instanceof TypeError) return NETWORK_ERROR

  return statusBody(NO_STATUS)
}

export function errorStatus(error: unknown) {
  return toErrorBody(error).status
}

export function errorCode(error: unknown) {
  return toErrorBody(error).code
}

export function alreadyGone(error: unknown) {
  return GONE_CODES.includes(errorCode(error))
}

export function fieldErrors<Field extends string>(error: unknown, keys: Record<Field, string>) {
  const fields = (toErrorBody(error).fields ?? [])
    .map(({ field }) => field)
    .filter((field): field is Field => Object.hasOwn(keys, field))

  return fields.length > 0
    ? (Object.fromEntries(fields.map((field) => [field, keys[field]])) as Partial<
        Record<Field, string>
      >)
    : null
}

export function errorKey(error: unknown) {
  const { code, status } = toErrorBody(error)
  const keys = [code, statusCode(status)].map((item) => `errors.${item}`)

  return keys.find((key) => i18n.exists(key)) ?? 'errors.unknown-error'
}

export function errorMessage(error: unknown) {
  return message(errorKey(error))
}

export function sessionEnded(error: unknown) {
  const { code, status } = toErrorBody(error)

  return status === 401 && SESSION_CODES.includes(code)
}

export function errorNotice(error: unknown, signedIn: boolean) {
  if (!sessionEnded(error)) return errorMessage(error)

  return signedIn ? message('errors.unauthorized-access') : null
}
