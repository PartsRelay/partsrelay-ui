import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/auth/core/auth.client'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import {
  endSession,
  failureNotice,
  redirectSignedIn,
  requireSession,
  sessionQuery,
  type Session,
} from '@/modules/auth/core/session.query'
import { googleSignIn, invitationFlow, loginFlow } from '@/modules/auth/core/sign-in'
import { loadAccount, watchAccount } from '@/modules/workspaces/core/account'

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { getSession: vi.fn(), organization: { getFullOrganization: vi.fn() } },
}))

let client: QueryClient
const date = new Date('2026-10-21T00:00:00Z')
const session = (id = 'user-a', organization = 'company-a'): NonNullable<Session> => ({
  user: {
    id,
    email: `${id}@example.com`,
    name: id,
    emailVerified: true,
    createdAt: date,
    updatedAt: date,
  },
  session: {
    id: 'session-a',
    userId: id,
    token: 'fixture-token',
    activeOrganizationId: organization,
    expiresAt: new Date('2026-10-22T00:00:00Z'),
    createdAt: date,
    updatedAt: date,
  },
})
const unauthorized = { status: 401, error: { code: 'UNAUTHORIZED', status: 401 } }

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.resetAllMocks()
  vi.stubGlobal('window', { location: { origin: 'https://app.example.com' } })
})
afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

describe('session boundaries', () => {
  it('revalidates a cached session before a protected route and clears stale private data', async () => {
    client.setQueryData(sessionQuery.queryKey, session())
    client.setQueryData(['searches', 'company-a'], ['private-record'])
    vi.mocked(authClient.getSession).mockResolvedValue(null)
    expect(await requireSession(client, '/searches/17')).toEqual({
      session: null,
      redirect: { to: '/login', search: { next: '/searches/17' } },
    })
    expect(client.getQueryData(['searches', 'company-a'])).toBeUndefined()
    expect(authClient.getSession).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { disableCookieCache: true },
      })
    )
  })

  it('redirects an unauthorized session response but surfaces a disconnected API', async () => {
    vi.mocked(authClient.getSession).mockRejectedValueOnce(unauthorized)
    expect((await requireSession(client, '//untrusted.example')).redirect?.search.next).toBe('/')
    const disconnected = new TypeError('Failed to fetch')
    vi.mocked(authClient.getSession).mockRejectedValueOnce(disconnected)
    await expect(requireSession(client, '/')).rejects.toBe(disconnected)
  })

  it('clears every private query on an authentication failure, including silent failures', () => {
    client.setQueryData(sessionQuery.queryKey, session())
    client.setQueryData(['workspace'], { id: 'company-a' })
    client.setQueryData(['contacts'], ['private-contact'])
    expect(failureNotice(client, unauthorized, true)).toBeNull()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
    expect(client.getQueryData(['workspace'])).toBeUndefined()
    expect(client.getQueryData(['contacts'])).toBeUndefined()
  })

  it('does not sign a valid user out for an ordinary permission denial', () => {
    client.setQueryData(sessionQuery.queryKey, session())
    failureNotice(client, { status: 403, error: { code: 'FORBIDDEN' } })
    expect(client.getQueryData(sessionQuery.queryKey)?.user.id).toBe('user-a')
  })

  it('removes previous company data if the backend reports a removed membership', async () => {
    client.setQueryData(sessionQuery.queryKey, session())
    client.setQueryData(['contacts'], ['private-contact'])
    vi.mocked(authClient.organization.getFullOrganization).mockRejectedValue({
      status: 404,
      error: { code: 'ROW_NOT_FOUND', status: 404 },
    })
    await expect(loadAccount(client, 'user-a')).rejects.toMatchObject({ status: 404 })
    expect(client.getQueryData(['contacts'])).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)?.user.id).toBe('user-a')
  })

  it.each([session('user-b'), session('user-a', 'company-b'), null])(
    'removes prior private data when the session identity or membership changes',
    (next) => {
      client.setQueryData(sessionQuery.queryKey, session())
      client.setQueryData(['workspace'], { id: 'company-a' })
      const onChange = vi.fn()
      const unsubscribe = watchAccount(client, onChange)
      client.setQueryData(sessionQuery.queryKey, next)
      expect(client.getQueryData(['workspace'])).toBeUndefined()
      expect(client.getQueryData(sessionQuery.queryKey)).toEqual(next)
      expect(onChange).toHaveBeenCalledOnce()
      unsubscribe()
    }
  )

  it('does not clear a valid account on a same-identity session refresh', () => {
    client.setQueryData(sessionQuery.queryKey, session())
    client.setQueryData(['workspace'], { id: 'company-a' })
    const onChange = vi.fn()
    const unsubscribe = watchAccount(client, onChange)
    client.setQueryData(sessionQuery.queryKey, session())
    expect(client.getQueryData(['workspace'])).toEqual({ id: 'company-a' })
    expect(onChange).not.toHaveBeenCalled()
    unsubscribe()
    endSession(client)
    expect(client.getQueryCache().getAll()).toHaveLength(1)
  })
})

describe('return destinations', () => {
  it.each([
    'https://untrusted.example',
    '//untrusted.example',
    '/\\untrusted.example',
    '/%5cuntrusted.example',
    '/%2fexample.com',
    '/%252fexample.com',
    '/\n/example.com',
  ])('rejects unsafe destination %s', (value) => {
    expect(redirectPath(value)).toBe('/')
  })

  it('preserves a safe deep link and encodes it in the Google return flow', async () => {
    const target = '/searches/17?query=oil%20filter#results'
    expect(redirectPath(target)).toBe(target)
    const flow = googleSignIn(loginFlow(target))
    expect(new URL(flow.callbackURL).origin).toBe('https://app.example.com')
    expect(new URL(flow.callbackURL).searchParams.get('next')).toBe(target)
    vi.mocked(authClient.getSession).mockResolvedValue(session())
    expect((await redirectSignedIn(client, { next: target }))?.href).toBe(target)
  })

  it('sanitizes direct sign-in inputs and removes only login errors from invitations', () => {
    const flow = googleSignIn({
      back: '//untrusted.example',
      failed: '/\\untrusted.example',
      selectAccount: false,
    })
    expect(flow.callbackURL).toBe('https://app.example.com/')
    expect(invitationFlow('/invitations/abc?error=denied&next=team#invite')).toEqual({
      back: '/invitations/abc?next=team#invite',
      failed: '/invitations/abc?next=team#invite',
      selectAccount: true,
    })
  })
})
