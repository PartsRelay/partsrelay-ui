import { isAxiosError } from 'axios'
import type { ErrorBody, FieldError } from '@/core/api/models'
import { message } from '@/core/message'
import { errors as texts } from '@/locales/en-US/errors.json'

export type { ErrorBody, FieldError }

export const NO_STATUS = 0

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

const SESSION_CODES = ['unauthorized', 'unauthorized-access']

const GONE_CODES = ['row-not-found', 'member-not-found', 'invitation-not-found']

export function kebabCode(code: string) {
  return code
    .replace(/^E_/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z\d]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const GENERIC_CODES = ['unknown-error', ...Object.values(STATUS_MESSAGES).map(kebabCode)]

const NETWORK_ERROR: ErrorBody = {
  code: 'network-error',
  status: NO_STATUS,
  message: 'Network Error',
}

function statusMessage(status: number) {
  if (status >= 500) return STATUS_MESSAGES[status] ?? STATUS_MESSAGES[500]!
  if (status >= 400) return STATUS_MESSAGES[status] ?? STATUS_MESSAGES[400]!

  return 'Unknown Error'
}

function statusCode(status: number) {
  return kebabCode(statusMessage(status))
}

function statusBody(status: number): ErrorBody {
  return { code: statusCode(status), status, message: statusMessage(status) }
}

function nonEmpty(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

function fromResponse(status: number, data: unknown): ErrorBody {
  const body: Partial<Record<keyof ErrorBody, unknown>> =
    typeof data === 'object' && data !== null ? data : {}
  const code = nonEmpty(body.code)
  const error = {
    code: code ? kebabCode(code) : statusCode(status),
    status,
    message: nonEmpty(body.message) ?? statusMessage(status),
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

export function redirectError(code: string): ErrorBody {
  const kebab = kebabCode(code)
  const words = kebab.replaceAll('-', ' ')

  return {
    code: kebab,
    status: NO_STATUS,
    message: `${words.charAt(0).toUpperCase()}${words.slice(1)}`,
  }
}

export function isGenericCode(code: string) {
  return GENERIC_CODES.includes(code)
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

function hasText(code: string) {
  return Object.hasOwn(texts, code)
}

export function errorKey(error: unknown) {
  const { code, status } = toErrorBody(error)

  return `errors.${[code, statusCode(status)].find(hasText) ?? 'unknown-error'}`
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
