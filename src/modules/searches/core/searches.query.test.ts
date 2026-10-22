import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { queryClient as appQueryClient } from '@/query-client'
import {
  searchKeys,
  searchesQuery,
  searchQuery,
  startSearch,
} from '@/modules/searches/core/searches.query'
import type { Search } from '@/modules/searches/core/search'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))
vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { getSession: vi.fn() } }))
vi.mock('@/core/notify', () => ({ notify: vi.fn() }))

const accepted: Search = {
  id: 17,
  plate: 'GH482KL',
  vin: null,
  nodeIds: [],
  status: 'running',
  source: 'web',
  createdAt: '2026-10-21T12:00:00Z',
}
let client: QueryClient
beforeEach(() => {
  client = new QueryClient()
  vi.resetAllMocks()
})
afterEach(() => {
  client.clear()
  appQueryClient.clear()
})

describe('workspace search cache', () => {
  it('isolates the same record and filters across workspaces and invalidates only the current company', async () => {
    const filters = { page: 1, requester: 'all' } as const
    const a = searchKeys.list('company-a', filters)
    const b = searchKeys.list('company-b', filters)
    const detailA = searchKeys.detail('company-a', 17)
    const detailB = searchKeys.detail('company-b', 17)
    client.setQueryData(a, ['a'])
    client.setQueryData(b, ['b'])
    client.setQueryData(detailA, { private: 'a' })
    client.setQueryData(detailB, { private: 'b' })
    await client.invalidateQueries({ queryKey: searchKeys.all('company-a'), refetchType: 'none' })
    expect(client.getQueryState(a)?.isInvalidated).toBe(true)
    expect(client.getQueryState(detailA)?.isInvalidated).toBe(true)
    expect(client.getQueryState(b)?.isInvalidated).toBe(false)
    expect(client.getQueryState(detailB)?.isInvalidated).toBe(false)
  })

  it('separates different page/requester filters while drawer state leaves the cache key stable', () => {
    const all = searchKeys.list('a', { page: 1, requester: 'all' })
    expect(searchKeys.list('a', { page: 2, requester: 'all' })).not.toEqual(all)
    expect(searchKeys.list('a', { page: 1, requester: 'user', person: 2 })).not.toEqual(all)
    expect(searchKeys.list('a', { page: 1, requester: 'contact', person: 2 })).not.toEqual(
      searchKeys.list('a', { page: 1, requester: 'user', person: 2 })
    )
    expect(searchKeys.list('a', { page: 1, requester: 'all', newSearch: true })).toEqual(all)
  })

  it('passes pagination, requester filters and cancellation to the generated history client', async () => {
    const response = { data: [accepted], metadata: { total: 1 } }
    vi.mocked(http).mockResolvedValue(response)
    const signal = new AbortController().signal
    const query = searchesQuery('a', { page: 2, requester: 'contact', person: 12 })
    expect(await query.queryFn({ signal })).toBe(response)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/workspace/lookups', method: 'GET' }),
      { params: { page: 2, perPage: 20, searcherType: 'contact', searcherId: 12 }, signal }
    )
    expect(query.refetchInterval).toBe(15_000)
  })

  it('unwraps detail responses and polls only while a search is running', async () => {
    vi.mocked(http).mockResolvedValue({ data: accepted })
    const signal = new AbortController().signal
    const query = searchQuery('a', 17)
    expect(await query.queryFn({ signal })).toBe(accepted)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/lookups/17', method: 'GET' }),
      { signal }
    )
    expect(query.refetchInterval({ state: { data: accepted } })).toBe(5_000)
    expect(query.refetchInterval({ state: { data: { ...accepted, status: 'done' } } })).toBe(false)
    expect(query.refetchInterval({ state: {} })).toBe(false)
  })
})

describe('accepted search requests', () => {
  it('sends the validated request once and preserves the running ID from the 202 response contract', async () => {
    vi.mocked(http).mockResolvedValue({ data: accepted })
    expect(await startSearch({ plate: ' gh 482 kl ', query: ' front brake pads ' })).toBe(accepted)
    expect(http).toHaveBeenCalledOnce()
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/lookups',
        method: 'POST',
        data: { plate: 'GH482KL', query: 'front brake pads' },
      }),
      undefined
    )
  })

  it('does not send an invalid request to the backend', async () => {
    await expect(startSearch({ plate: '?', query: '' })).rejects.toThrow()
    expect(http).not.toHaveBeenCalled()
  })

  it('does not automatically replay an ambiguous failed write with the application mutation policy', async () => {
    const failure = new TypeError('Connection lost after sending request')
    vi.mocked(http).mockRejectedValue(failure)
    expect(appQueryClient.getDefaultOptions().mutations?.retry).toBe(false)
    const mutation = appQueryClient
      .getMutationCache()
      .build(appQueryClient, { mutationFn: startSearch })
    await expect(mutation.execute({ plate: 'GH482KL', query: 'front brake pads' })).rejects.toBe(
      failure
    )
    expect(http).toHaveBeenCalledOnce()
  })
})
