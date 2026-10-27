import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import {
  lookupQuery,
  lookupStatsQuery,
  lookupsQuery,
  refreshLookupLists,
} from '@/modules/lookups/core/lookups.query'
import { lookupFixture, pageFixture } from '@/modules/lookups/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('lookup queries', () => {
  it('asks the core for the filtered queue, through the generated client', async () => {
    const page = pageFixture([lookupFixture(3, { source: 'whatsapp' })])
    vi.mocked(http).mockResolvedValue(page)
    const params = { page: 2, searcherType: 'contact' as const, searcherId: 7, days: 30 }

    expect(lookupsQuery(params).queryKey).toEqual(['/api/v1/workspace/lookups', params])
    expect(lookupsQuery(params).meta).toEqual({ silent: true })
    expect(await new QueryClient().fetchQuery(lookupsQuery(params))).toBe(page)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/workspace/lookups', method: 'GET', params }),
      undefined
    )
    expect(axios.getUri({ url: '/lookups', params: { ...params, search: undefined } })).toBe(
      '/lookups?page=2&searcherType=contact&searcherId=7&days=30'
    )
  })

  it('loads one lookup by id and shows its own errors', async () => {
    const response = { data: lookupFixture(9) }
    vi.mocked(http).mockResolvedValue(response)
    const query = lookupQuery(9)

    expect(query.queryKey).toEqual(['/api/v1/lookups/9'])
    expect(query.meta).toEqual({ silent: true })
    expect(await new QueryClient().fetchQuery(query)).toBe(response)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/lookups/9', method: 'GET' }),
      undefined
    )
    expect(query.select?.(response)).toMatchObject({ id: 9, status: 'done' })
  })

  it('asks for the stats of the last 30 days', () => {
    expect(lookupStatsQuery.queryKey).toEqual(['/api/v1/workspace/lookups/stats', { days: 30 }])
  })

  it('never polls, the live stream refreshes them', () => {
    expect(lookupsQuery({ page: 1 })).not.toHaveProperty('refetchInterval')
    expect(lookupQuery(1)).not.toHaveProperty('refetchInterval')
  })

  it('keeps the previous list while the next loads', () => {
    const previous = pageFixture([lookupFixture(1)])
    const placeholder = lookupsQuery({ page: 2 }).placeholderData

    expect(typeof placeholder === 'function' && placeholder(previous, undefined)).toBe(previous)
  })

  it('refreshes the queue and the stats together', async () => {
    const client = new QueryClient()
    const list = lookupsQuery({ page: 1 }).queryKey
    client.setQueryData(list, pageFixture([]))
    client.setQueryData(lookupStatsQuery.queryKey, { data: {} } as never)

    await refreshLookupLists(client)

    expect(client.getQueryState(list)?.isInvalidated).toBe(true)
    expect(client.getQueryState(lookupStatsQuery.queryKey)?.isInvalidated).toBe(true)
  })
})
