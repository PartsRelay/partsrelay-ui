import { type MutationOptions, MutationObserver, QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/core/auth/auth.client'
import { acceptError, invitationHeadline, invitationView } from '@/modules/core/auth/invitation'
import { acceptInvitationMutation, invitationKeys } from '@/modules/core/auth/invitation.query'
import { createMagicLinkForm, resendWait } from '@/modules/core/auth/magic-link'
import { cancelOneTap, oneTapError, startOneTap } from '@/modules/core/auth/one-tap'
import { redirectSignedIn, requireSession, sessionQuery } from '@/modules/core/auth/session.query'
import {
  invitationFlow,
  loginError,
  loginFlow,
  loginSearchSchema,
} from '@/modules/core/auth/sign-in'
import { signOutMutation } from '@/modules/core/auth/sign-out.mutation'
import { message } from '@/modules/core/shared/message'
import { authError, axiosError, companyFixture, member } from '@/modules/core/testing/fixtures'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

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

describe('invitation sign in', () => {
  it('comes back to the invitation with any sign in method', async () => {
    const flow = invitationFlow('/invitations/12?error=access_denied&error_description=no')
    await run(flow.google, undefined)
    await run(flow.magicLink, 'luca@gmail.com')

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: 'https://app.test/invitations/12',
      errorCallbackURL: 'https://app.test/invitations/12',
      additionalParams: { prompt: 'select_account' },
    })
    expect(authClient.signIn.magicLink).toHaveBeenCalledWith({
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
    client.setQueryData(workspaceKeys.all, { ...companyFixture(), setup: 'pending' })
    vi.mocked(authClient.organization.acceptInvitation).mockResolvedValue({} as never)

    await new MutationObserver(client, acceptInvitationMutation('31', 'Officina Ferri')).mutate()

    expect(client.getQueryData(workspaceKeys.all)).toBeUndefined()
  })

  it('checks the company again when the join is refused', async () => {
    const client = new QueryClient()
    client.setQueryData(invitationKeys.company, companyFixture())
    vi.mocked(authClient.organization.acceptInvitation).mockRejectedValue(
      authError(403, 'WORKSPACE_NOT_RELEASABLE')
    )
    const accept = acceptInvitationMutation('12', 'Officina Ferri S.r.l.')

    await expect(new MutationObserver(client, accept).mutate()).rejects.toBeTruthy()
    expect(client.getQueryState(invitationKeys.company)?.isInvalidated).toBe(true)
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
