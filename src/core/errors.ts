import { isAxiosError } from 'axios'
import { message } from '@/core/message'

// REST errors wrap the code, Better Auth sends it at the top
type ErrorBody = { error?: { code?: string }; code?: string }

// Other coded 401s, like removing a member, keep the session
const SESSION_CODES = ['UNAUTHORIZED', 'UNAUTHORIZED_ACCESS']

function codeless(status: number | undefined) {
  return status === 429 ? 'TOO_MANY_REQUESTS' : 'UNKNOWN'
}

export function errorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined
}

export function errorCode(error: unknown) {
  if (!isAxiosError<ErrorBody>(error)) return 'UNKNOWN'
  if (!error.response) return 'NETWORK_ERROR'

  const body = error.response.data

  return body?.error?.code ?? body?.code ?? codeless(error.response.status)
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
