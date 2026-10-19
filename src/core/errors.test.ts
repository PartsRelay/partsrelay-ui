import { describe, expect, it } from 'vite-plus/test'
import {
  errorCode,
  errorMessage,
  errorNotice,
  errorStatus,
  isGenericCode,
  sessionEnded,
  toAppError,
} from '@/core/errors'
import { message, messageKeys } from '@/core/message'
import { authError, axiosError, coreError } from '@/core/testing/fixtures'

describe('errors', () => {
  it('reads the error of the core from the REST API', () => {
    const error = axiosError(422, coreError(422, 'VALIDATION_ERROR'))

    expect(toAppError(error)).toEqual({
      code: 'VALIDATION_ERROR',
      status: 422,
      message: 'VALIDATION_ERROR',
    })
    expect(errorStatus(error)).toBe(422)
    expect(errorMessage(error)).toEqual(message('errors.VALIDATION_ERROR'))
  })

  it('reads the same shape from the Better Auth client', () => {
    const error = authError(403, 'WORKSPACE_NOT_RELEASABLE')

    expect(toAppError(error)).toEqual({
      code: 'WORKSPACE_NOT_RELEASABLE',
      status: 403,
      message: 'WORKSPACE_NOT_RELEASABLE',
    })
  })

  it('keeps the message out when production leaves it out', () => {
    const error = axiosError(429, { error: { code: 'TOO_MANY_REQUESTS', status: 429 } })

    expect(toAppError(error)).toEqual({ code: 'TOO_MANY_REQUESTS', status: 429, message: null })
  })

  it('tells network failures apart', () => {
    expect(errorCode(axiosError())).toBe('NETWORK_ERROR')
    expect(errorCode(new TypeError('Failed to fetch'))).toBe('NETWORK_ERROR')
    expect(errorStatus(new TypeError('Failed to fetch'))).toBeUndefined()
    expect(errorCode(new Error('boom'))).toBe('UNKNOWN')
    expect(errorCode(null)).toBe('UNKNOWN')
    expect(errorCode(axiosError(502, '<html>'))).toBe('UNKNOWN')
  })

  it('knows the codes the core takes from the status alone', () => {
    expect(isGenericCode('BAD_REQUEST')).toBe(true)
    expect(isGenericCode('UNKNOWN')).toBe(true)
    expect(isGenericCode('EMAIL_NOT_VERIFIED')).toBe(false)
  })

  it('reports an ended session once', () => {
    expect(errorNotice(axiosError(401, coreError(401, 'UNAUTHORIZED_ACCESS')), true)).toEqual(
      message('errors.UNAUTHORIZED_ACCESS')
    )
    expect(errorNotice(authError(401, 'UNAUTHORIZED'), false)).toBeNull()
    expect(errorNotice(axiosError(403, coreError(403, 'AUTHORIZATION_FAILURE')), true)).toEqual(
      message('errors.AUTHORIZATION_FAILURE')
    )
  })

  it('ends the session only on the codes of a missing session', () => {
    expect(sessionEnded(authError(401, 'UNAUTHORIZED'))).toBe(true)
    expect(sessionEnded(axiosError(401, coreError(401, 'UNAUTHORIZED_ACCESS')))).toBe(true)
    expect(sessionEnded(authError(400, 'BAD_REQUEST'))).toBe(false)
    expect(sessionEnded(axiosError())).toBe(false)
  })

  it('keeps the session on a refused removal', () => {
    const refused = authError(401, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')

    expect(sessionEnded(refused)).toBe(false)
    expect(errorNotice(refused, true)).toEqual(
      message('errors.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')
    )
  })

  it('falls back to a generic text for unknown error codes', () => {
    expect(messageKeys(message('errors.NEW_CODE'))).toEqual(['errors.NEW_CODE', 'errors.UNKNOWN'])
    expect(messageKeys(message('login.title'))).toEqual(['login.title'])
  })
})
