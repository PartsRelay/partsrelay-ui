import { QueryClient } from '@tanstack/query-core'
import { getGlobalBroadcastChannel } from 'better-auth/client'
import { addDays } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { type Session, sessionQuery } from '@/modules/auth/core/session.query'
import { loadAccount, watchAccount } from '@/modules/workspaces/core/account'
import type { Role } from '@/modules/workspaces/core/role'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

const now = new Date('2026-10-21T10:00:00Z')

const people = {
  mark: { id: '1', name: 'Mark Reed', email: 'mark.reed@redwoodparts.com' },
  julia: { id: '2', name: 'Julia Bennett', email: 'julia.bennett@redwoodparts.com' },
}

const member = (person: typeof people.mark, role: Role) => ({
  id: `m${person.id}`,
  organizationId: '1',
  userId: person.id,
  role,
  createdAt: now,
  user: person,
})

const redwoodParts = (): FullOrganization => ({
  id: '1',
  name: 'Redwood Parts Ltd',
  slug: 'redwood-parts',
  logo: null,
  metadata: '{"setup":"done"}',
  locale: 'en-US',
  createdAt: now,
  members: [member(people.mark, 'owner'), member(people.julia, 'admin')],
  invitations: [],
})

const { getFullOrganization } = vi.hoisted(() => ({ getFullOrganization: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { organization: { getFullOrganization } },
}))

const sessionOf = ({ id, name, email }: { id: string; name: string; email: string }) =>
  ({
    user: { id, name, email, emailVerified: true, image: null, createdAt: now, updatedAt: now },
    session: {
      id: `s${id}`,
      token: 'token',
      userId: id,
      activeOrganizationId: '1',
      expiresAt: addDays(now, 7),
      createdAt: now,
      updatedAt: now,
    },
  }) satisfies NonNullable<Session>

const withoutJulia = () => {
  const organization = redwoodParts()

  return {
    ...organization,
    members: organization.members.filter(({ userId }) => userId !== people.julia.id),
  }
}

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  getFullOrganization.mockReset()
})

describe('loadAccount', () => {
  it('finds me in the company of the core', async () => {
    getFullOrganization.mockResolvedValue(redwoodParts())

    const { workspace, me } = await loadAccount(client, people.julia.id)

    expect(workspace.name).toBe('Redwood Parts Ltd')
    expect(me.member.name).toBe('Julia Bennett')
    expect(me.role).toBe('admin')
  })

  it('uses the cached company when I am in it', async () => {
    client.setQueryData(workspaceKey, redwoodParts())

    expect((await loadAccount(client, people.mark.id)).me.role).toBe('owner')
    expect(getFullOrganization).not.toHaveBeenCalled()
  })

  it('asks the core again when the cached company misses me', async () => {
    client.setQueryData(workspaceKey, withoutJulia())
    getFullOrganization.mockResolvedValue(redwoodParts())

    expect((await loadAccount(client, people.julia.id)).me.role).toBe('admin')
    expect(getFullOrganization).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(workspaceKey)?.members).toHaveLength(2)
  })

  it('fails when the core does not list me either', async () => {
    client.setQueryData(workspaceKey, withoutJulia())
    getFullOrganization.mockResolvedValue(withoutJulia())

    await expect(loadAccount(client, people.julia.id)).rejects.toThrow('Missing membership')
  })
})

describe('watchAccount', () => {
  const signIn = (person: { id: string; name: string; email: string }) =>
    client.setQueryData(sessionQuery.queryKey, sessionOf(person))

  const signOut = () => client.setQueryData(sessionQuery.queryKey, null)

  const tabs = getGlobalBroadcastChannel()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports when another account signs in', () => {
    signIn(people.mark)
    const onChange = vi.fn()
    watchAccount(client, onChange)

    signIn(people.julia)

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('ignores the first sign in, signing out and other queries', () => {
    const onChange = vi.fn()
    watchAccount(client, onChange)

    signIn(people.mark)
    client.setQueryData(workspaceKey, redwoodParts())
    signOut()
    signIn(people.mark)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('remembers who was signed in across a sign out', () => {
    signIn(people.mark)
    const onChange = vi.fn()
    watchAccount(client, onChange)

    signOut()
    signIn(people.julia)

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('asks the other tabs to check their session when an account signs in', () => {
    const post = vi.spyOn(tabs, 'post')
    watchAccount(client, vi.fn())

    signIn(people.mark)
    signIn(people.mark)
    signOut()
    signIn(people.julia)

    expect(post).toHaveBeenCalledTimes(2)
  })

  it('checks the session again when another tab signs in', () => {
    const subscribe = vi.spyOn(tabs, 'subscribe')
    signIn(people.mark)
    watchAccount(client, vi.fn())
    const [[otherTab]] = subscribe.mock.calls

    otherTab({ event: 'session', data: { trigger: 'getSession' }, clientId: 'tab', timestamp: 0 })

    expect(client.getQueryState(sessionQuery.queryKey)?.isInvalidated).toBe(true)
  })

  it('stops once unsubscribed', () => {
    signIn(people.mark)
    const onChange = vi.fn()
    const stop = watchAccount(client, onChange)

    stop()
    signIn(people.julia)

    expect(onChange).not.toHaveBeenCalled()
  })
})
