import { isAxiosError } from 'axios'
import { message } from '@/core/message'

// The core sends { error: { code, status, message } }, message outside production
type ErrorBody = { error?: { code?: string; message?: string } } | null | undefined

// What the Better Auth client throws
type AuthClientError = { status: number; error: ErrorBody }

export type AppError = { code: string; status: number | null; message: string | null }

// Other coded 401s, like removing a member, keep the session
const SESSION_CODES = ['UNAUTHORIZED', 'UNAUTHORIZED_ACCESS']

// Codes the core takes from the status alone
const STATUS_CODES = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_SERVER_ERROR',
]

function isAuthClientError(error: unknown): error is AuthClientError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as AuthClientError).status === 'number'
  )
}

function fromCore(status: number, body: ErrorBody): AppError {
  return { code: body?.error?.code ?? 'UNKNOWN', status, message: body?.error?.message ?? null }
}

export function toAppError(error: unknown): AppError {
  if (isAxiosError<ErrorBody>(error)) {
    if (error.response) return fromCore(error.response.status, error.response.data)

    return { code: 'NETWORK_ERROR', status: null, message: error.message }
  }

  if (isAuthClientError(error)) return fromCore(error.status, error.error)

  // fetch rejects with a TypeError when offline
  const local = error instanceof Error ? error.message : null

  return {
    code: error instanceof TypeError ? 'NETWORK_ERROR' : 'UNKNOWN',
    status: null,
    message: local,
  }
}

export function isGenericCode(code: string) {
  return code === 'UNKNOWN' || STATUS_CODES.includes(code)
}

export function errorStatus(error: unknown) {
  return toAppError(error).status ?? undefined
}

export function errorCode(error: unknown) {
  return toAppError(error).code
}

export function errorMessage(error: unknown) {
  return message(`errors.${errorCode(error)}`)
}

export function sessionEnded(error: unknown) {
  const { code, status } = toAppError(error)

  return status === 401 && SESSION_CODES.includes(code)
}

export function errorNotice(error: unknown, signedIn: boolean) {
  if (!sessionEnded(error)) return errorMessage(error)

  return signedIn ? message('errors.UNAUTHORIZED_ACCESS') : null
}
