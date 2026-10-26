import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  googleSignIn,
  invitationFlow,
  loginError,
  loginFlow,
  loginSearchSchema,
  magicLinkSignIn,
} from '@/modules/auth/core/sign-in'

// Used for types only, the real client needs a browser
vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: {} }))

// The helpers build absolute URLs on the app origin
beforeEach(() => {
  vi.stubGlobal('window', { location: new URL('http://localhost:5173/workspace') })
})

describe('loginFlow', () => {
  it('comes back to the login page, which sends home', () => {
    expect(loginFlow()).toEqual({
      back: '/login?signedIn=true',
      failed: '/login',
      selectAccount: false,
    })
  })

  it('keeps the page asked for before signing in', () => {
    expect(loginFlow('/company')).toEqual({
      back: '/login?next=%2Fcompany&signedIn=true',
      failed: '/login?next=%2Fcompany',
      selectAccount: false,
    })
  })

  it('drops a next page outside the app', () => {
    expect(loginFlow('//evil.example')).toEqual(loginFlow())
  })

  it('keeps the page asked for on browsers without URLSearchParams.size', () => {
    const size = vi
      .spyOn(URLSearchParams.prototype, 'size', 'get')
      .mockReturnValue(undefined as never)
    const flow = loginFlow('/company')
    size.mockRestore()

    expect(flow).toEqual({
      back: '/login?next=%2Fcompany&signedIn=true',
      failed: '/login?next=%2Fcompany',
      selectAccount: false,
    })
  })
})

describe('invitationFlow', () => {
  it('returns to the invitation without the previous sign in error', () => {
    expect(
      invitationFlow('/invitations/31?error=access_denied&error_description=denied&tab=1#top')
    ).toEqual({
      back: '/invitations/31?tab=1#top',
      failed: '/invitations/31?tab=1#top',
      selectAccount: true,
    })
  })
})

describe('googleSignIn', () => {
  it('sends absolute callback URLs', () => {
    expect(googleSignIn(loginFlow('/company'))).toEqual({
      provider: 'google',
      callbackURL: 'http://localhost:5173/login?next=%2Fcompany&signedIn=true',
      errorCallbackURL: 'http://localhost:5173/login?next=%2Fcompany',
      additionalParams: undefined,
    })
  })

  it('lets the invited person pick another Google account', () => {
    expect(googleSignIn(invitationFlow('/invitations/31')).additionalParams).toEqual({
      prompt: 'select_account',
    })
  })
})

describe('magicLinkSignIn', () => {
  it('encodes the callback URLs once more for the core', () => {
    expect(magicLinkSignIn(loginFlow('/company'), 'mark.reed@redwoodparts.com')).toEqual({
      email: 'mark.reed@redwoodparts.com',
      callbackURL: 'http://localhost:5173/login?next=%252Fcompany&signedIn=true',
      errorCallbackURL: 'http://localhost:5173/login?next=%252Fcompany',
    })
  })
})

describe('loginError', () => {
  it('shows nothing without an error', () => {
    expect(loginError(undefined)).toBeNull()
    expect(loginError('')).toBeNull()
  })

  it.each([
    ['access_denied', 'login.errors.cancelled'],
    ['INVALID_TOKEN', 'errors.invalid-token'],
    ['failed_to_create_session', 'errors.failed-to-create-session'],
    ['email_not_verified', 'errors.email-not-verified'],
    ['state_mismatch', 'login.errors.failed'],
  ])('explains %s', (error, key) => {
    expect(loginError(error)).toEqual([key])
  })
})

describe('loginSearchSchema', () => {
  it('keeps valid search params', () => {
    expect(
      loginSearchSchema.parse({ next: '/company', signedIn: true, error: 'access_denied' })
    ).toEqual({ next: '/company', signedIn: true, error: 'access_denied' })
  })

  it('drops search params of the wrong type instead of failing', () => {
    expect(loginSearchSchema.parse({ next: 42, signedIn: 'yes', error: ['x'] })).toEqual({})
  })
})
