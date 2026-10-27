import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { QueryClient } from '@tanstack/query-core'
import {
  completeSignIn,
  googleSignInURL,
  invitationFlow,
  loginError,
  loginSearchSchema,
  magicLinkSignIn,
} from '@/modules/auth/core/sign-in'

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { oneTimeToken: { verify } } }))

beforeEach(() => {
  vi.stubGlobal('window', { location: new URL('http://localhost:5173/workspace') })
})

const loginFlow = {
  back: '/login?next=%2Fcompany&signedIn=true',
  failed: '/login?next=%2Fcompany',
  selectAccount: false,
}

describe('invitationFlow', () => {
  it('returns to the invitation without the previous sign in error', () => {
    expect(
      invitationFlow('/invitations/31?error=access-denied&error_description=denied&tab=1#top')
    ).toEqual({
      back: '/invitations/31?tab=1#top',
      failed: '/invitations/31?tab=1#top',
      selectAccount: true,
    })
  })
})

const handoff =
  'http://localhost:5173/auth/handoff?next=%2Flogin%3Fnext%3D%252Fcompany%26signedIn%3Dtrue'

describe('googleSignInURL', () => {
  it('starts Google on the core and comes back through the handoff', () => {
    const url = new URL(googleSignInURL(loginFlow))

    expect(url.origin + url.pathname).toBe('http://localhost:5173/auth/google')
    expect(url.searchParams.get('callbackURL')).toBe(handoff)
    expect(url.searchParams.get('errorCallbackURL')).toBe(
      'http://localhost:5173/login?next=%2Fcompany'
    )
    expect(url.searchParams.has('prompt')).toBe(false)
  })

  it('lets the invited person pick another Google account', () => {
    const url = new URL(googleSignInURL(invitationFlow('/invitations/31')))

    expect(url.searchParams.get('prompt')).toBe('select_account')
  })
})

describe('magicLinkSignIn', () => {
  it('comes back through the handoff, encoded once more for the core', () => {
    expect(magicLinkSignIn(loginFlow, 'mark.reed@redwoodparts.com')).toEqual({
      email: 'mark.reed@redwoodparts.com',
      callbackURL: handoff.replaceAll('%', '%25'),
      errorCallbackURL: 'http://localhost:5173/login?next=%252Fcompany',
    })
  })
})

describe('completeSignIn', () => {
  const client = { resetQueries: vi.fn() }
  const complete = (search: { token?: string; next?: string }) =>
    completeSignIn(client as unknown as QueryClient, search)

  beforeEach(() => {
    verify.mockReset()
    client.resetQueries.mockReset()
  })

  it('exchanges the one-time token and goes back', async () => {
    verify.mockResolvedValue({})

    await expect(complete({ token: 'ott', next: loginFlow.back })).resolves.toBe(loginFlow.back)
    expect(verify).toHaveBeenCalledWith({ token: 'ott' })
    expect(client.resetQueries).toHaveBeenCalledWith({ queryKey: ['session'] })
  })

  it('goes back with an error when the token is refused', async () => {
    verify.mockRejectedValue(new Error('Invalid token'))

    await expect(complete({ token: 'used', next: '/invitations/31' })).resolves.toBe(
      '/invitations/31?error=invalid-token'
    )
    expect(client.resetQueries).not.toHaveBeenCalled()
  })

  it('never leaves the app without a token', async () => {
    await expect(complete({ next: '//evil.example' })).resolves.toBe('/?error=invalid-token')
    expect(verify).not.toHaveBeenCalled()
  })
})

describe('loginError', () => {
  it('shows nothing without an error', () => {
    expect(loginError(undefined)).toBeNull()
    expect(loginError('')).toBeNull()
  })

  it.each([
    ['access-denied', 'login.errors.cancelled'],
    ['invalid-token', 'errors.invalid-token'],
    ['failed-to-create-session', 'errors.failed-to-create-session'],
    ['unable-to-create-session', 'errors.failed-to-create-session'],
    ['email-not-verified', 'errors.email-not-verified'],
    ['too-many-requests', 'errors.too-many-requests'],
    ['state-mismatch', 'login.errors.failed'],
  ])('explains %s', (error, key) => {
    expect(loginError(error)).toEqual([key])
  })
})

describe('loginSearchSchema', () => {
  it('keeps valid search params', () => {
    expect(
      loginSearchSchema.parse({ next: '/company', signedIn: true, error: 'access-denied' })
    ).toEqual({ next: '/company', signedIn: true, error: 'access-denied' })
  })

  it('drops search params of the wrong type instead of failing', () => {
    expect(loginSearchSchema.parse({ next: 42, signedIn: 'yes', error: ['x'] })).toEqual({})
  })
})
