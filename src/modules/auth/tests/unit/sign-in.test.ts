import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  googleSignIn,
  invitationFlow,
  loginError,
  loginSearchSchema,
  magicLinkSignIn,
} from '@/modules/auth/core/sign-in'

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: {} }))

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

describe('googleSignIn', () => {
  it('sends absolute callback URLs', () => {
    expect(googleSignIn(loginFlow)).toEqual({
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
    expect(magicLinkSignIn(loginFlow, 'mark.reed@redwoodparts.com')).toEqual({
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
