import { type MutationOptions, MutationObserver, QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { signOut, socialSignIn } from '@/core/api/auth/endpoints/default/default'
import { signInWithMagicLink } from '@/core/api/auth/endpoints/magic-link/magic-link'
import { postOneTapCallback } from '@/core/api/auth/endpoints/one-tap/one-tap'
import { postOrganizationAcceptInvitation } from '@/core/api/auth/endpoints/organization/organization'
import { acceptError, invitationHeadline, invitationView } from '@/modules/auth/core/invitation'
import { acceptInvitationMutation, currentCompanyKey } from '@/modules/auth/core/invitation.query'
import { createMagicLinkForm, resendWait } from '@/modules/auth/core/magic-link'
import { cancelOneTap, oneTapError, startOneTap } from '@/modules/auth/core/one-tap'
import { redirectSignedIn, requireSession, sessionQuery } from '@/modules/auth/core/session.query'
import {
  invitationFlow,
  loginError,
  loginFlow,
  loginSearchSchema,
} from '@/modules/auth/core/sign-in'
import { signOutMutation } from '@/modules/auth/core/sign-out.mutation'
import { message } from '@/core/message'
import {
  authError,
  axiosError,
  companyFixture,
  member,
  organizationFixture,
} from '@/core/testing/fixtures'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

const env = vi.hoisted(() => ({ VITE_GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com' }))

vi.mock('@/env', () => ({ env }))

vi.mock('@/core/api/auth/endpoints/default/default', async (original) => ({
  ...(await original()),
  signOut: vi.fn(),
  socialSignIn: vi.fn(),
}))
vi.mock('@/core/api/auth/endpoints/magic-link/magic-link', () => ({
  signInWithMagicLink: vi.fn(),
}))
vi.mock('@/core/api/auth/endpoints/one-tap/one-tap', () => ({ postOneTapCallback: vi.fn() }))
vi.mock('@/core/api/auth/endpoints/organization/organization', async (original) => ({
  ...(await original()),
  postOrganizationAcceptInvitation: vi.fn(),
}))

const location = { origin: 'https://app.test', assign: vi.fn() }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(socialSignIn).mockResolvedValue({
    url: 'https://accounts.google.com/o',
    redirect: true,
  })
  vi.stubGlobal('window', { location })
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

    expect(vi.mocked(socialSignIn).mock.calls.map(([body]) => body)).toEqual([
      {
        provider: 'google',
        callbackURL: 'https://app.test/login?next=%2Fteam&signedIn=true',
        errorCallbackURL: 'https://app.test/login?next=%2Fteam',
        disableRedirect: true,
        additionalParams: undefined,
      },
      {
        provider: 'google',
        callbackURL: 'https://app.test/login?signedIn=true',
        errorCallbackURL: 'https://app.test/login',
        disableRedirect: true,
        additionalParams: undefined,
      },
    ])
    expect(location.assign).toHaveBeenCalledWith('https://accounts.google.com/o')
  })
})

describe('invitation sign in', () => {
  it('comes back to the invitation with any sign in method', async () => {
    const flow = invitationFlow('/invitations/12?error=access_denied&error_description=no')
    await run(flow.google, undefined)
    await run(flow.magicLink, 'luca@gmail.com')

    expect(socialSignIn).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: 'https://app.test/invitations/12',
      errorCallbackURL: 'https://app.test/invitations/12',
      disableRedirect: true,
      additionalParams: { prompt: 'select_account' },
    })
    expect(signInWithMagicLink).toHaveBeenCalledWith({
      email: 'luca@gmail.com',
      callbackURL: 'https://app.test/invitations/12',
      errorCallbackURL: 'https://app.test/invitations/12',
    })
    expect(flow.afterSignIn).toBe('/invitations/12')
  })
})

describe('magic link', () => {
  it('sends absolute links back to the login', async () => {
    const flow = loginFlow('/team')
    await run(flow.magicLink, 'marco@ricambirossi.it')

    expect(signInWithMagicLink).toHaveBeenCalledWith({
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
  const callback = vi.mocked(postOneTapCallback)

  function google() {
    const identity = {
      initialize: vi.fn(),
      prompt: vi.fn(() => {
        identity.initialize.mock.calls[0]![0].callback({ credential: 'google-id-token' })
      }),
      cancel: vi.fn(),
      disableAutoSelect: vi.fn(),
    }
    const script = {
      addEventListener: (type: string, done: () => void) => type === 'load' && done(),
    }
    vi.stubGlobal('document', { createElement: () => script, head: { append: vi.fn() } })
    vi.stubGlobal('window', { location, google: { accounts: { id: identity } } })

    return identity
  }

  it('sends the Google credential to the core and reports the session', async () => {
    const identity = google()
    callback.mockResolvedValue({ token: 't', user: {} } as never)
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await startOneTap({ onSuccess, onError })

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(callback).toHaveBeenCalledWith({ idToken: 'google-id-token' })
    expect(identity.initialize.mock.calls[0]![0]).toMatchObject({
      client_id: 'client.apps.googleusercontent.com',
      auto_select: false,
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports a refused account or an unreachable core', async () => {
    google()
    const refused = authError(403, 'EMAIL_NOT_VERIFIED')
    callback.mockRejectedValue(refused)
    const onError = vi.fn()

    await startOneTap({ onSuccess: vi.fn(), onError })

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(refused))
    expect(oneTapError(refused)).toEqual(message('errors.EMAIL_NOT_VERIFIED'))
    expect(oneTapError(authError(400))).toEqual(message('errors.AUTH_GOOGLE_FAILED'))
    expect(oneTapError(axiosError())).toEqual(message('errors.NETWORK_ERROR'))
    expect(oneTapError(new Error('Google Identity Services did not load'))).toBeNull()
  })

  it('stays off without a Google client id', async () => {
    const identity = google()
    env.VITE_GOOGLE_CLIENT_ID = ''
    await startOneTap({ onSuccess: vi.fn(), onError: vi.fn() })
    env.VITE_GOOGLE_CLIENT_ID = 'client.apps.googleusercontent.com'

    expect(identity.initialize).not.toHaveBeenCalled()
  })

  it('closes the prompt and stops automatic sign in after signing out', () => {
    const identity = google()

    cancelOneTap()
    expect(identity.cancel).toHaveBeenCalledOnce()
    expect(identity.disableAutoSelect).not.toHaveBeenCalled()

    cancelOneTap({ signedOut: true })
    expect(identity.disableAutoSelect).toHaveBeenCalledOnce()
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

describe('invitation', () => {
  const invited = {
    organizationId: '7',
    organizationName: 'Officina Ferri S.r.l.',
    inviterEmail: 's.ferri@officinaferri.it',
    role: 'viewer',
    email: 'luca@gmail.com',
    status: 'pending',
    expiresAt: '2026-10-19T10:00:00Z',
  }
  const details = {
    workspace: 'Officina Ferri S.r.l.',
    inviter: 's.ferri@officinaferri.it',
    role: 'viewer' as const,
    roleLabel: message('roles.viewer'),
    expiresAt: new Date('2026-10-19T10:00:00Z'),
  }
  const solo = { data: { id: '9', members: [member('1', 'owner', 'Luca Ferri')] }, error: null }
  const view = (company: { data?: Pick<Workspace, 'id' | 'members'>; error: unknown } = solo) =>
    invitationView({ invitation: invited, error: null, signedIn: true, company })
  const failing = (error: unknown) =>
    invitationView({ invitation: undefined, error, signedIn: true, company: solo })
  const expired = { state: 'unavailable', reason: message('invitation.unavailable.expired') }

  it('asks to sign in before loading the invitation', () => {
    expect(
      invitationView({ invitation: undefined, error: null, signedIn: false, company: solo })
    ).toEqual({ state: 'signIn' })
  })

  it('asks for the invited account', () => {
    expect(failing(authError(403, 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION'))).toEqual({
      state: 'otherAccount',
    })
  })

  it('explains why it cannot be used', () => {
    expect(failing(authError(400))).toEqual(expired)
    expect(failing(authError(400, 'INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION'))).toEqual({
      state: 'unavailable',
      reason: message('errors.INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION'),
    })
    expect(acceptError(authError(403, 'WORKSPACE_NOT_RELEASABLE'))).toEqual(
      message('invitation.unavailable.companyNotEmpty')
    )
    expect(acceptError(authError(400, 'INVITATION_NOT_FOUND'))).toEqual(
      message('errors.INVITATION_NOT_FOUND')
    )
  })

  it('tells a failure apart from an expired invitation', () => {
    expect(failing(axiosError())).toEqual({
      state: 'failed',
      reason: message('errors.NETWORK_ERROR'),
    })
    expect(failing(authError(500))).toEqual({ state: 'failed', reason: message('errors.UNKNOWN') })
  })

  it('joins only from a company nobody else would lose', () => {
    expect(view({ data: { ...companyFixture(), id: '7' }, error: null })).toEqual({
      state: 'unavailable',
      reason: message('invitation.unavailable.alreadyMember', { workspace: details.workspace }),
    })
    expect(view({ data: companyFixture(), error: null })).toEqual({
      state: 'unavailable',
      reason: message('invitation.unavailable.companyNotEmpty'),
    })
    expect(view({ error: null })).toEqual({ state: 'loading' })
    expect(view({ error: axiosError() })).toEqual({
      state: 'failed',
      reason: message('errors.NETWORK_ERROR'),
    })
    expect(view()).toEqual({ state: 'ready', details })
  })

  it('waits for the invitation to load', () => {
    expect(
      invitationView({
        invitation: undefined,
        error: null,
        loading: true,
        signedIn: false,
        company: solo,
      })
    ).toEqual({ state: 'loading' })
    expect(failing(null)).toEqual({ state: 'loading' })
  })

  it('names the inviter in the headline', () => {
    expect(invitationHeadline(details)).toEqual(
      message('invitation.headline', {
        inviter: 's.ferri@officinaferri.it',
        workspace: 'Officina Ferri S.r.l.',
      })
    )
  })
})

describe('accepting', () => {
  it('forgets the company left behind once the join succeeds', async () => {
    const client = new QueryClient()
    client.setQueryData(workspaceKey, {
      ...organizationFixture(),
      metadata: JSON.stringify({ setup: 'pending' }),
    })
    vi.mocked(postOrganizationAcceptInvitation).mockResolvedValue({} as never)

    await new MutationObserver(client, acceptInvitationMutation('31', 'Officina Ferri')).mutate()

    expect(client.getQueryData(workspaceKey)).toBeUndefined()
  })

  it('checks the company again when the join is refused', async () => {
    const client = new QueryClient()
    client.setQueryData(currentCompanyKey, organizationFixture())
    vi.mocked(postOrganizationAcceptInvitation).mockRejectedValue(
      authError(403, 'WORKSPACE_NOT_RELEASABLE')
    )
    const accept = acceptInvitationMutation('12', 'Officina Ferri S.r.l.')

    await expect(new MutationObserver(client, accept).mutate()).rejects.toBeTruthy()
    expect(client.getQueryState(currentCompanyKey)?.isInvalidated).toBe(true)
  })
})

describe('sign out', () => {
  it('forgets everything about the account', async () => {
    const client = new QueryClient()
    client.setQueryData(workspaceKey, organizationFixture())
    vi.mocked(signOut).mockResolvedValue({ success: true } as never)

    await new MutationObserver(client, signOutMutation).mutate()

    expect(client.getQueryData(workspaceKey)).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })
})
