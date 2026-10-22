import { QueryClient } from '@tanstack/query-core'
import { addDays } from 'date-fns'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
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

// The company as the core sends it
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

// The company before Julia joined
const withoutJulia = () => {
  const organization = redwoodParts()

  return {
    ...organization,
    members: organization.members.filter(({ userId }) => userId !== people.julia.id),
  }
}

let client: QueryClient

beforeEach(() => {
  // Fresh cached data stays, like within the app staleTime
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

  it('stops once unsubscribed', () => {
    signIn(people.mark)
    const onChange = vi.fn()
    const stop = watchAccount(client, onChange)

    stop()
    signIn(people.julia)

    expect(onChange).not.toHaveBeenCalled()
  })
})
