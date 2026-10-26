import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vite-plus/test'
import { alreadyGone, errorMessage, type FieldError, fieldErrors, toErrorBody } from '@/core/errors'
import { i18n } from '@/i18n'

const config = { headers: new AxiosHeaders() }

function axiosError(status: number, data: unknown) {
  const response = { status, statusText: '', headers: {}, config, data }

  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
}

function coreError(status: number, code: string, fields?: FieldError[]) {
  return axiosError(status, { code, status, message: 'Failed', ...(fields && { fields }) })
}

const STATUS_CODES = [
  'bad-request',
  'unauthorized',
  'forbidden',
  'not-found',
  'unprocessable-entity',
  'too-many-requests',
  'internal-server-error',
  'bad-gateway',
  'service-unavailable',
  'gateway-timeout',
]

const CATALOG_CODES = [
  'validation-error',
  'unauthorized-access',
  'authorization-failure',
  'row-not-found',
  'route-not-found',
  'role-change-not-allowed',
  'locale-not-supported',
  'workspace-role-not-managed',
  'workspace-not-releasable',
  'invalid-token',
  'failed-to-create-session',
  'email-not-verified',
  'invalid-email',
  'organization-not-found',
  'member-not-found',
  'invitation-not-found',
  'user-is-already-a-member-of-this-organization',
  'user-is-already-invited-to-this-organization',
  'you-are-not-the-recipient-of-the-invitation',
  'inviter-is-no-longer-a-member-of-the-organization',
  'invitation-limit-reached',
  'you-are-not-allowed-to-invite-users-to-this-organization',
  'you-are-not-allowed-to-invite-user-with-this-role',
  'you-are-not-allowed-to-cancel-this-invitation',
  'you-are-not-allowed-to-update-this-organization',
  'you-are-not-allowed-to-delete-this-organization',
  'you-are-not-allowed-to-update-this-member',
  'you-are-not-allowed-to-delete-this-member',
  'you-are-not-a-member-of-this-organization',
  'you-cannot-leave-the-organization-as-the-only-owner',
  'network-error',
  'unknown-error',
]

describe('error body', () => {
  it('reads the flat body of the core', () => {
    const body = { code: 'row-not-found', status: 404, message: 'Row not found' }

    expect(toErrorBody(axiosError(404, body))).toEqual(body)
  })

  it('reads the body a Better Auth client error carries', () => {
    const body = {
      code: 'role-change-not-allowed',
      status: 403,
      message: 'Roles are fixed, only the ownership can be transferred',
    }

    expect(toErrorBody({ status: 403, statusText: 'Forbidden', error: body })).toEqual(body)
  })

  it('takes code and message from the status when the body has none', () => {
    expect(toErrorBody(axiosError(502, '<html>Bad gateway</html>'))).toEqual({
      code: 'bad-gateway',
      status: 502,
      message: 'Bad Gateway',
    })
    expect(toErrorBody({ status: 409, error: null })).toEqual({
      code: 'conflict',
      status: 409,
      message: 'Conflict',
    })
  })

  it('reads the status of a refused Transmit subscription', () => {
    expect(toErrorBody(new Response(null, { status: 400 }))).toEqual({
      code: 'bad-request',
      status: 400,
      message: 'Bad Request',
    })
  })

  it('turns a failure without a response into network-error', () => {
    const network = { code: 'network-error', status: 0, message: 'Network Error' }

    expect(toErrorBody(new AxiosError('Network Error', 'ERR_NETWORK', config))).toEqual(network)
    expect(toErrorBody(new TypeError('Failed to fetch'))).toEqual(network)
  })

  it('turns anything else into unknown-error', () => {
    const unknown = { code: 'unknown-error', status: 0, message: 'Unknown Error' }

    expect(toErrorBody(new Error('No active company'))).toEqual(unknown)
    expect(toErrorBody('failed')).toEqual(unknown)
  })
})

describe('error texts', () => {
  it('exist for every code the core can answer the UI and every status fallback', () => {
    const missing = [...CATALOG_CODES, ...STATUS_CODES].filter(
      (code) => !i18n.exists(`errors.${code}`)
    )

    expect(missing).toEqual([])
  })

  it('fall back to the text of the status, then to the generic one', () => {
    expect(errorMessage(coreError(403, 'workspace-role-not-managed'))).toEqual([
      'errors.workspace-role-not-managed',
    ])
    expect(errorMessage(coreError(504, 'yq-timeout'))).toEqual(['errors.gateway-timeout'])
    expect(errorMessage(coreError(403, 'invalid-origin'))).toEqual(['errors.forbidden'])
    expect(errorMessage(coreError(418, 'teapot'))).toEqual(['errors.unknown-error'])
    expect(errorMessage(new Error('No active company'))).toEqual(['errors.unknown-error'])
  })
})

describe('field errors', () => {
  it('keeps the fields the core names', () => {
    const error = coreError(422, 'validation-error', [{ field: 'email', rule: 'maxLength' }])

    expect(toErrorBody(error)).toEqual({
      code: 'validation-error',
      status: 422,
      message: 'Failed',
      fields: [{ field: 'email', rule: 'maxLength' }],
    })
    expect(toErrorBody(coreError(403, 'forbidden'))).not.toHaveProperty('fields')
  })

  it('gives each known field its error key and skips the others', () => {
    const error = coreError(422, 'validation-error', [
      { field: 'email', rule: 'email' },
      { field: 'organizationId', rule: 'required' },
    ])

    expect(fieldErrors(error, { email: 'errors.email' })).toEqual({ email: 'errors.email' })
    expect(fieldErrors(error, { name: 'errors.name' })).toBeNull()
    expect(fieldErrors(new TypeError('offline'), { email: 'errors.email' })).toBeNull()
  })

  it('reads the fields of a Better Auth client error too', () => {
    const error = {
      status: 400,
      error: {
        code: 'validation-error',
        status: 400,
        message: '[body.name] Invalid input',
        fields: [{ field: 'name' }],
      },
    }

    expect(fieldErrors(error, { name: 'errors.name' })).toEqual({ name: 'errors.name' })
  })
})

describe('already gone', () => {
  it('tells when the row the call acted on no longer exists', () => {
    expect(alreadyGone(coreError(404, 'row-not-found'))).toBe(true)
    expect(alreadyGone(coreError(400, 'member-not-found'))).toBe(true)
    expect(alreadyGone(coreError(400, 'invitation-not-found'))).toBe(true)
  })

  it('leaves the other failures to retry', () => {
    expect(alreadyGone(coreError(403, 'workspace-role-not-managed'))).toBe(false)
    expect(alreadyGone(coreError(404, 'route-not-found'))).toBe(false)
    expect(alreadyGone(new TypeError('offline'))).toBe(false)
  })
})
