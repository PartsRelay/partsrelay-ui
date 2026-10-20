import { isAxiosError } from 'axios'
import { message } from '@/core/message'

// The same body the core sends, message only in development
export type ErrorBody = {
  code: string
  status: number
  message?: string
}

// What the Better Auth client throws
type AuthClientError = { status: number; error: Partial<ErrorBody> | null }

// No HTTP response, like a network failure
export const NO_STATUS = 0

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

function errorBody(code: string, status: number, text?: string): ErrorBody {
  return import.meta.env.DEV && text ? { code, status, message: text } : { code, status }
}

function fromCore(status: number, body: Partial<ErrorBody> | null | undefined) {
  return errorBody(body?.code ?? 'UNKNOWN', status, body?.message)
}

export function toErrorBody(error: unknown): ErrorBody {
  if (isAxiosError<Partial<ErrorBody>>(error)) {
    if (error.response) return fromCore(error.response.status, error.response.data)

    return errorBody('NETWORK_ERROR', NO_STATUS, error.message)
  }

  if (isAuthClientError(error)) return fromCore(error.status, error.error)

  // fetch rejects with a TypeError when offline
  const code = error instanceof TypeError ? 'NETWORK_ERROR' : 'UNKNOWN'

  return errorBody(code, NO_STATUS, error instanceof Error ? error.message : undefined)
}

export function isGenericCode(code: string) {
  return code === 'UNKNOWN' || STATUS_CODES.includes(code)
}

export function errorStatus(error: unknown) {
  return toErrorBody(error).status
}

export function errorCode(error: unknown) {
  return toErrorBody(error).code
}

export function errorMessage(error: unknown) {
  return message(`errors.${errorCode(error)}`)
}

export function sessionEnded(error: unknown) {
  const { code, status } = toErrorBody(error)

  return status === 401 && SESSION_CODES.includes(code)
}

export function errorNotice(error: unknown, signedIn: boolean) {
  if (!sessionEnded(error)) return errorMessage(error)

  return signedIn ? message('errors.UNAUTHORIZED_ACCESS') : null
}
