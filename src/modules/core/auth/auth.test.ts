import { type MutationOptions, MutationObserver, QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/core/auth/auth.client'
import { createMagicLinkForm, resendWait } from '@/modules/core/auth/magic-link'
import { cancelOneTap, oneTapError, startOneTap } from '@/modules/core/auth/one-tap'
import { redirectSignedIn, requireSession, sessionQuery } from '@/modules/core/auth/session.query'
import { loginError, loginFlow, loginSearchSchema } from '@/modules/core/auth/sign-in'
import { signOutMutation } from '@/modules/core/auth/sign-out.mutation'
import { message } from '@/modules/core/shared/message'
import { authError } from '@/modules/core/testing/fixtures'

const env = vi.hoisted(() => ({ VITE_GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com' }))

vi.mock('@/core/config/env', () => ({ env }))

vi.mock('@/modules/core/auth/auth.client', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
    oneTap: vi.fn(),
    signIn: { social: vi.fn(), magicLink: vi.fn() },
    organization: { acceptInvitation: vi.fn() },
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('window', { location: { origin: 'https://app.test' } })
})

afterEach(() => vi.unstubAllGlobals())

function run<TVariables>(
  options: MutationOptions<unknown, Error, TVariables>,
  variables: TVariables
) {
  return new MutationObserver(new QueryClient(), options).mutate(variables)
}

describe('login', () => {
  it('explains why the sign in failed', () => {
    expect(loginError(undefined)).toBeNull()
    expect(loginError('access_denied')).toEqual(message('login.errors.cancelled'))
    expect(loginError('INVALID_TOKEN')).toEqual(message('errors.INVALID_TOKEN'))
    expect(loginError('failed_to_create_session')).toEqual(
      message('errors.failed_to_create_session')
    )
    expect(loginError('state_mismatch')).toEqual(message('login.errors.failed'))
    expect(loginError('toString')).toEqual(message('login.errors.failed'))
  })

  it('drops invalid search params', () => {
    expect(loginSearchSchema.parse({ next: 3, error: 'x', signedIn: 'yes' })).toEqual({
      next: undefined,
      error: 'x',
      signedIn: undefined,
    })
  })
})

describe('google sign in', () => {
  it('comes back through the login to announce the account', async () => {
    await run(loginFlow('/team').google, undefined)
    await run(loginFlow('//evil.com').google, undefined)

    expect(vi.mocked(authClient.signIn.social).mock.calls.map(([body]) => body)).toEqual([
      {
        provider: 'google',
        callbackURL: 'https://app.test/login?next=%2Fteam&signedIn=true',
        errorCallbackURL: 'https://app.test/login?next=%2Fteam',
        additionalParams: undefined,
      },
      {
        provider: 'google',
        callbackURL: 'https://app.test/login?signedIn=true',
        errorCallbackURL: 'https://app.test/login',
        additionalParams: undefined,
      },
    ])
  })
})

describe('magic link', () => {
  it('sends absolute links back to the login', async () => {
    const flow = loginFlow('/team')
    await run(flow.magicLink, 'marco@ricambirossi.it')

    expect(authClient.signIn.magicLink).toHaveBeenCalledWith({
      email: 'marco@ricambirossi.it',
      callbackURL: 'https://app.test/login?next=%2Fteam&signedIn=true',
      errorCallbackURL: 'https://app.test/login?next=%2Fteam',
    })
    expect(flow.afterSignIn).toBe('/login?next=%2Fteam&signedIn=true')
  })

  it('checks the address before sending', () => {
    const form = createMagicLinkForm()

    form.actions.setEmail('marco@')
    expect(form.actions.submit()).toBeNull()
    expect(form.state.error).toEqual(message('login.magicLink.errors.email'))

    form.actions.setEmail(' Marco@RicambiRossi.it ')
    expect(form.state.error).toBeNull()
    expect(form.actions.submit()).toBe('marco@ricambirossi.it')
  })

  it('waits before sending the link again and lets the address change', () => {
    const form = createMagicLinkForm()
    form.actions.setEmail('marco@ricambirossi.it')
    form.actions.sent('marco@ricambirossi.it', 1_000)

    expect(form.state).toMatchObject({ sent: 'marco@ricambirossi.it', sentAt: 1_000 })
    expect(resendWait(form.state.sentAt, 1_000)).toBe(30)
    expect(resendWait(form.state.sentAt, 21_500)).toBe(10)
    expect(resendWait(form.state.sentAt, 31_000)).toBe(0)
    expect(resendWait(null, 0)).toBe(0)

    form.actions.failed(message('errors.TOO_MANY_REQUESTS'))
    expect(form.state.error).toEqual(message('errors.TOO_MANY_REQUESTS'))

    form.actions.edit()
    expect(form.state).toEqual({
      email: 'marco@ricambirossi.it',
      sent: null,
      sentAt: null,
      error: null,
    })
  })
})

describe('one tap', () => {
  const oneTap = vi.mocked(authClient.oneTap)

  it('reports the session without leaving the page', async () => {
    oneTap.mockImplementation(async (options) => {
      await options?.fetchOptions?.onSuccess?.({} as never)
    })
    const onSuccess = vi.fn()
    const onError = vi.fn()

    startOneTap({ onSuccess, onError })

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onError).not.toHaveBeenCalled()
    expect(oneTap.mock.calls[0]![0]).not.toHaveProperty('callbackURL')
  })

  it('reports a refused account', async () => {
    const refused = authError(403, 'EMAIL_NOT_VERIFIED')
    oneTap.mockRejectedValue(refused)
    const onError = vi.fn()

    startOneTap({ onSuccess: vi.fn(), onError })

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(refused))
    expect(oneTapError(refused)).toEqual(message('errors.EMAIL_NOT_VERIFIED'))
    expect(oneTapError(authError(400))).toEqual(message('errors.AUTH_GOOGLE_FAILED'))
    expect(oneTapError(new Error('Failed to load Google Identity Services script'))).toBeNull()
  })

  it('stays off without a Google client id', () => {
    env.VITE_GOOGLE_CLIENT_ID = ''
    startOneTap({ onSuccess: vi.fn(), onError: vi.fn() })
    env.VITE_GOOGLE_CLIENT_ID = 'client.apps.googleusercontent.com'

    expect(oneTap).not.toHaveBeenCalled()
  })

  it('closes the prompt', () => {
    const cancel = vi.fn()
    vi.stubGlobal('window', { google: { accounts: { id: { cancel } } } })

    cancelOneTap()

    expect(cancel).toHaveBeenCalledOnce()
  })
})

describe('session guard', () => {
  it('sends signed out users to the login with the way back', async () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, null)

    expect((await requireSession(client, '/team?transfer=true')).redirect).toEqual({
      to: '/login',
      search: { next: '/team?transfer=true' },
    })
    expect(await redirectSignedIn(client, { next: '/team' })).toBeNull()
  })

  it('lets signed in users through and away from the login', async () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, {
      user: { id: '1', email: 'marco@ricambirossi.it' },
    } as never)

    expect((await requireSession(client, '/')).redirect).toBeNull()
    expect(await redirectSignedIn(client, { next: '/team' })).toEqual({
      href: '/team',
      notice: null,
    })
    expect(await redirectSignedIn(client, { next: '//evil.com', signedIn: true })).toEqual({
      href: '/',
      notice: message('auth.notices.signedIn', { email: 'marco@ricambirossi.it' }),
    })
  })
})

describe('sign out', () => {
  it('forgets everything about the account', async () => {
    const client = new QueryClient()
    client.setQueryData(['workspace'], { name: 'Ricambi Rossi S.r.l.' })
    vi.mocked(authClient.signOut).mockResolvedValue({ success: true } as never)

    await new MutationObserver(client, signOutMutation).mutate()

    expect(client.getQueryData(['workspace'])).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })
})
