import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { companyFixture } from '@/core/testing/fixtures'
import { loadAccount, watchAccount, watchCompanyLocale } from '@/modules/workspaces/core/account'
import { workspaceKeys, workspaceQuery } from '@/modules/workspaces/core/workspace.query'

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { getSession: vi.fn(), organization: { getFullOrganization: vi.fn() } },
}))

const getFullOrganization = vi.mocked(authClient.organization.getFullOrganization)

function organization(userId: string) {
  return {
    id: '7',
    name: 'Officina',
    members: [
      {
        id: '1',
        role: 'admin',
        userId,
        createdAt: '2026-10-01T08:00:00.000Z',
        user: { id: userId, email: 'a@b.it', name: 'Anna' },
      },
    ],
    invitations: [],
  }
}

function session(id: string) {
  return { user: { id } } as never
}

describe('loadAccount', () => {
  const fresh = () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })

  beforeEach(() => getFullOrganization.mockReset())

  it('uses the cached workspace when it has the user', async () => {
    getFullOrganization.mockResolvedValue(organization('10') as never)
    const client = fresh()
    await client.prefetchQuery(workspaceQuery)
    const { workspace, me } = await loadAccount(client, '10')

    expect(workspace).toMatchObject({ name: 'Officina', setup: 'done' })
    expect(me.role).toBe('admin')
    expect(getFullOrganization).toHaveBeenCalledTimes(1)
  })

  it('refetches a workspace of another account', async () => {
    getFullOrganization
      .mockResolvedValueOnce(organization('20') as never)
      .mockResolvedValueOnce(organization('10') as never)
    const client = fresh()
    await client.prefetchQuery(workspaceQuery)

    expect((await loadAccount(client, '10')).me.role).toBe('admin')
    expect(getFullOrganization).toHaveBeenCalledTimes(2)
  })

  it('fails when the user is still missing', async () => {
    getFullOrganization.mockResolvedValue(organization('20') as never)

    await expect(loadAccount(fresh(), '10')).rejects.toThrow('Missing membership')
  })
})

describe('watchAccount', () => {
  it('reports when another user signs in', () => {
    const client = new QueryClient()
    const onChange = vi.fn()
    client.setQueryData(sessionQuery.queryKey, session('1'))
    const stop = watchAccount(client, onChange)

    client.setQueryData(sessionQuery.queryKey, session('1'))
    client.setQueryData(sessionQuery.queryKey, null)
    expect(onChange).not.toHaveBeenCalled()

    client.setQueryData(sessionQuery.queryKey, session('2'))
    client.setQueryData(sessionQuery.queryKey, session('2'))
    expect(onChange).toHaveBeenCalledTimes(1)

    stop()
  })
})

describe('watchCompanyLocale', () => {
  it('follows the company language while signed in, else the browser', () => {
    const client = new QueryClient()
    const onChange = vi.fn()
    const stop = watchCompanyLocale(client, onChange)

    client.setQueryData(sessionQuery.queryKey, session('101'))
    client.setQueryData(workspaceKeys.all, { ...companyFixture(), setup: 'pending' })
    expect(onChange).not.toHaveBeenCalled()

    client.setQueryData(workspaceKeys.all, companyFixture())
    client.setQueryData(workspaceKeys.all, { ...companyFixture(), name: 'Rossi Ricambi' })
    client.setQueryData(workspaceKeys.all, { ...companyFixture(), locale: 'en' })
    client.clear()

    expect(onChange.mock.calls).toEqual([['it'], ['en'], [null]])
    stop()
  })

  it('drops the company language when the session ends', () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, session('101'))
    client.setQueryData(workspaceKeys.all, companyFixture())
    const onChange = vi.fn()
    const stop = watchCompanyLocale(client, onChange)

    client.setQueryData(sessionQuery.queryKey, null)

    expect(onChange).toHaveBeenCalledWith(null)
    stop()
  })
})
