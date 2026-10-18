import { isAxiosError } from 'axios'
import { message } from '@/modules/core/shared/message'

type ApiErrorBody = { error?: { code?: string } }
type AuthError = { status?: number; error?: { code?: string } }

// Other coded 401s, like removing a member, keep the session
const SESSION_CODES = ['UNAUTHORIZED', 'UNAUTHORIZED_ACCESS']

function codeless(status: number | undefined) {
  return status === 429 ? 'TOO_MANY_REQUESTS' : 'UNKNOWN'
}

export function errorStatus(error: unknown) {
  if (isAxiosError(error)) return error.response?.status

  return (error as AuthError | null)?.status
}

export function errorCode(error: unknown) {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'NETWORK_ERROR'

    return error.response.data?.error?.code ?? codeless(error.response.status)
  }

  // fetch rejects with a TypeError when offline
  if (error instanceof TypeError) return 'NETWORK_ERROR'

  const auth = error as AuthError | null

  return auth?.error?.code ?? codeless(auth?.status)
}

export function errorMessage(error: unknown) {
  return message(`errors.${errorCode(error)}`)
}

export function sessionEnded(error: unknown) {
  const code = errorCode(error)

  // Better Auth sends some missing sessions without a code
  return errorStatus(error) === 401 && (SESSION_CODES.includes(code) || code === 'UNKNOWN')
}

export function errorNotice(error: unknown, signedIn: boolean) {
  if (!sessionEnded(error)) return errorMessage(error)

  return signedIn ? message('errors.UNAUTHORIZED_ACCESS') : null
}
