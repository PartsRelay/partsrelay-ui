import { describe, expect, it } from 'vite-plus/test'
import {
  errorCode,
  errorMessage,
  errorNotice,
  errorStatus,
  fieldErrors,
  sessionEnded,
} from '@/modules/core/shared/errors'
import { literal, message, messageKeys } from '@/modules/core/shared/message'
import { authError, axiosError } from '@/modules/core/testing/fixtures'

describe('errors', () => {
  it('reads the core error code', () => {
    const error = axiosError(422, { error: { code: 'VALIDATION_ERROR' } })

    expect(errorCode(error)).toBe('VALIDATION_ERROR')
    expect(errorStatus(error)).toBe(422)
    expect(errorMessage(error)).toEqual(message('errors.VALIDATION_ERROR'))
  })

  it('shows the message of the core, already in the company language', () => {
    const error = axiosError(403, {
      error: {
        code: 'AUTHORIZATION_FAILURE',
        status: 403,
        message: 'Non hai i permessi per questa operazione',
      },
    })

    expect(errorMessage(error)).toEqual(
      literal('errors.AUTHORIZATION_FAILURE', 'Non hai i permessi per questa operazione')
    )
    expect(errorNotice(error, true)).toEqual(errorMessage(error))
    expect(errorMessage(axiosError(500, { error: { code: 'X', message: '' } }))).toEqual(
      message('errors.X')
    )
  })

  it('reads the message of each invalid field', () => {
    const error = axiosError(422, {
      error: {
        code: 'VALIDATION_ERROR',
        status: 422,
        message: 'Request payload failed validation',
        details: [
          { field: 'phone', rule: 'waId', message: 'Must start with +' },
          { field: 'phone', rule: 'database.unique', message: 'Already in use' },
          { field: 'name', rule: 'maxLength', message: 'Too long' },
        ],
      },
    })

    expect(fieldErrors(error)).toEqual({
      phone: literal('errors.VALIDATION_ERROR', 'Must start with +'),
      name: literal('errors.VALIDATION_ERROR', 'Too long'),
    })
    expect(fieldErrors(axiosError(422, { error: { code: 'VALIDATION_ERROR' } }))).toEqual({})
    expect(fieldErrors(authError(400, 'INVALID_EMAIL'))).toEqual({})
  })

  it('tells network failures apart', () => {
    expect(errorCode(axiosError())).toBe('NETWORK_ERROR')
    expect(errorCode(new TypeError('Failed to fetch'))).toBe('NETWORK_ERROR')
  })

  it('translates Better Auth errors by code', () => {
    const error = authError(403, 'WORKSPACE_NOT_RELEASABLE')

    expect(errorMessage(error)).toEqual(message('errors.WORKSPACE_NOT_RELEASABLE'))
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
