import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  endSession,
  failureNotice,
  redirectSignedIn,
  requireSession,
  type Session,
  sessionQuery,
} from '@/modules/auth/core/session.query'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { getSession } }))

// What the Better Auth client throws
const authError = (status: number, code: string) => ({
  status,
  error: { code, status, message: 'Failed' },
})

const session = {
  user: {
    id: '1',
    name: 'Mark Reed',
    email: 'mark.reed@redwoodparts.com',
    emailVerified: true,
    image: null,
    createdAt: new Date('2025-09-16T10:00:00Z'),
    updatedAt: new Date('2026-10-20T10:00:00Z'),
  },
  session: {
    id: '1',
    token: 'token',
    userId: '1',
    activeOrganizationId: '1',
    expiresAt: new Date('2026-10-28T10:00:00Z'),
    createdAt: new Date('2026-10-21T10:00:00Z'),
    updatedAt: new Date('2026-10-21T10:00:00Z'),
  },
} satisfies NonNullable<Session>

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  getSession.mockReset()
})

describe('requireSession', () => {
  it('sends a visitor to the login, back to the page asked for', async () => {
    getSession.mockResolvedValue(null)

    expect(await requireSession(client, '/company?tab=name')).toEqual({
      session: null,
      redirect: { to: '/login', search: { next: '/company?tab=name' } },
    })
  })

  it('lets a signed in user through, asking the core once', async () => {
    getSession.mockResolvedValue(session)

    expect(await requireSession(client, '/workspace')).toEqual({ session, redirect: null })
    await requireSession(client, '/company')
    expect(getSession).toHaveBeenCalledTimes(1)
  })
})

describe('redirectSignedIn', () => {
  it('keeps a visitor on the login page', async () => {
    getSession.mockResolvedValue(null)

    expect(await redirectSignedIn(client, { next: '/company' })).toBeNull()
  })

  it('sends a signed in user on, greeting them after signing in', async () => {
    getSession.mockResolvedValue(session)

    expect(await redirectSignedIn(client, { next: '/company', signedIn: true })).toEqual({
      href: '/company',
      notice: ['auth.notices.signed-in', { email: 'mark.reed@redwoodparts.com' }],
    })
  })

  it('goes home for a next page outside the app, without a greeting', async () => {
    getSession.mockResolvedValue(session)

    expect(await redirectSignedIn(client, { next: 'https://evil.example' })).toEqual({
      href: '/',
      notice: null,
    })
  })
})

describe('failureNotice', () => {
  it('ends an expired session and says so', () => {
    client.setQueryData(sessionQuery.queryKey, session)

    expect(failureNotice(client, authError(401, 'unauthorized'))).toEqual([
      'errors.unauthorized-access',
    ])
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })

  it('stays quiet about a session that was never there', () => {
    expect(failureNotice(client, authError(401, 'unauthorized'))).toBeNull()
  })

  it('keeps the session on other coded 401s', () => {
    client.setQueryData(sessionQuery.queryKey, session)
    const error = authError(401, 'you-are-not-allowed-to-delete-this-member')

    expect(failureNotice(client, error)).toEqual([
      'errors.you-are-not-allowed-to-delete-this-member',
    ])
    expect(client.getQueryData(sessionQuery.queryKey)).toBe(session)
  })

  it('ends the session and says so even when the caller shows its errors itself', () => {
    client.setQueryData(sessionQuery.queryKey, session)

    expect(failureNotice(client, authError(401, 'unauthorized-access'), true)).toEqual([
      'errors.unauthorized-access',
    ])
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })

  it('leaves other errors to the caller that shows them itself', () => {
    client.setQueryData(sessionQuery.queryKey, session)

    expect(failureNotice(client, authError(400, 'bad-request'), true)).toBeNull()
    expect(client.getQueryData(sessionQuery.queryKey)).toBe(session)
  })
})

describe('endSession', () => {
  it('forgets every cached query and the session', () => {
    client.setQueryData(sessionQuery.queryKey, session)
    client.setQueryData(['workspace'], { name: 'Redwood Parts Ltd' })

    endSession(client)

    expect(client.getQueryData(['workspace'])).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })
})
