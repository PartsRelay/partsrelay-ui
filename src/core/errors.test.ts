import { describe, expect, it } from 'vite-plus/test'
import { errorCode, errorMessage, errorNotice, errorStatus, sessionEnded } from '@/core/errors'
import { message, messageKeys } from '@/core/message'
import { authError, axiosError } from '@/core/testing/fixtures'

describe('errors', () => {
  it('reads the core error code', () => {
    const error = axiosError(422, { error: { code: 'VALIDATION_ERROR' } })

    expect(errorCode(error)).toBe('VALIDATION_ERROR')
    expect(errorStatus(error)).toBe(422)
    expect(errorMessage(error)).toEqual(message('errors.VALIDATION_ERROR'))
  })

  it('tells network failures apart', () => {
    expect(errorCode(axiosError())).toBe('NETWORK_ERROR')
    expect(errorCode(new TypeError('Failed to fetch'))).toBe('UNKNOWN')
  })

  it('reads Better Auth errors', () => {
    const error = authError(403, 'WORKSPACE_NOT_RELEASABLE')

    expect(errorCode(error)).toBe('WORKSPACE_NOT_RELEASABLE')
    expect(errorStatus(error)).toBe(403)
    expect(errorCode(authError(400))).toBe('UNKNOWN')
    expect(errorCode(new Error('boom'))).toBe('UNKNOWN')
    expect(errorCode(null)).toBe('UNKNOWN')
  })

  it('names rate limited requests that carry no code', () => {
    expect(errorCode(authError(429))).toBe('TOO_MANY_REQUESTS')
    expect(errorCode(axiosError(429))).toBe('TOO_MANY_REQUESTS')
  })

  it('reports an ended session once', () => {
    expect(errorNotice(axiosError(401, { error: { code: 'UNAUTHORIZED_ACCESS' } }), true)).toEqual(
      message('errors.UNAUTHORIZED_ACCESS')
    )
    expect(errorNotice(authError(401, 'UNAUTHORIZED'), false)).toBeNull()
    expect(
      errorNotice(axiosError(403, { error: { code: 'AUTHORIZATION_FAILURE' } }), true)
    ).toEqual(message('errors.AUTHORIZATION_FAILURE'))
  })

  it('ends the session on a 401 without a code', () => {
    const missing = (body: unknown) => axiosError(401, body)

    expect(sessionEnded(missing({ message: 'User not found' }))).toBe(true)
    expect(sessionEnded(missing({ message: 'Not authenticated' }))).toBe(true)
    expect(sessionEnded(missing(''))).toBe(true)
    expect(sessionEnded(axiosError(401))).toBe(true)
    expect(sessionEnded(authError(400))).toBe(false)
    expect(sessionEnded(axiosError())).toBe(false)
  })

  it('keeps the session on a refused removal', () => {
    const refused = authError(401, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')

    expect(sessionEnded(refused)).toBe(false)
    expect(sessionEnded(authError(401, 'UNAUTHORIZED'))).toBe(true)
    expect(errorNotice(refused, true)).toEqual(
      message('errors.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')
    )
  })

  it('falls back to a generic text for unknown error codes', () => {
    expect(messageKeys(message('errors.NEW_CODE'))).toEqual(['errors.NEW_CODE', 'errors.UNKNOWN'])
    expect(messageKeys(message('login.title'))).toEqual(['login.title'])
  })
})
