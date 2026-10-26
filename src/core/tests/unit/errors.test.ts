import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vite-plus/test'
import { alreadyGone, type FieldError, fieldErrors, toErrorBody } from '@/core/errors'

function coreError(status: number, code: string, fields?: FieldError[]) {
  const config = { headers: new AxiosHeaders() }
  const data = { code, status, ...(fields && { fields }) }
  const response = { status, statusText: '', headers: {}, config, data }

  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
}

describe('field errors', () => {
  it('keeps the fields the core names, in production too', () => {
    const error = coreError(422, 'VALIDATION_ERROR', [{ field: 'email', rule: 'email' }])

    expect(toErrorBody(error)).toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 422,
      fields: [{ field: 'email', rule: 'email' }],
    })
    expect(toErrorBody(coreError(403, 'FORBIDDEN'))).not.toHaveProperty('fields')
  })

  it('gives each known field its error key and skips the others', () => {
    const error = coreError(422, 'VALIDATION_ERROR', [
      { field: 'email', rule: 'email' },
      { field: 'organizationId', rule: 'required' },
    ])

    expect(fieldErrors(error, { email: 'errors.email' })).toEqual({ email: 'errors.email' })
    expect(fieldErrors(error, { name: 'errors.name' })).toBeNull()
    expect(fieldErrors(new TypeError('offline'), { email: 'errors.email' })).toBeNull()
  })

  it('reads the fields of a Better Auth client error too', () => {
    const error = { status: 422, error: { code: 'VALIDATION_ERROR', fields: [{ field: 'name' }] } }

    expect(fieldErrors(error, { name: 'errors.name' })).toEqual({ name: 'errors.name' })
  })
})

describe('already gone', () => {
  it('tells when the row the call acted on no longer exists', () => {
    expect(alreadyGone(coreError(404, 'ROW_NOT_FOUND'))).toBe(true)
    expect(alreadyGone({ status: 400, error: { code: 'MEMBER_NOT_FOUND' } })).toBe(true)
    expect(alreadyGone({ status: 400, error: { code: 'INVITATION_NOT_FOUND' } })).toBe(true)
  })

  it('leaves the other failures to retry', () => {
    expect(alreadyGone(coreError(403, 'WORKSPACE_ROLE_NOT_MANAGED'))).toBe(false)
    expect(alreadyGone(coreError(404, 'ROUTE_NOT_FOUND'))).toBe(false)
    expect(alreadyGone(new TypeError('offline'))).toBe(false)
  })
})
