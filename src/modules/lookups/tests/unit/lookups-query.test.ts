import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import type { LookupObject } from '@/core/api/models'
import { type PaginationParams, withPerPage } from '@/core/pagination'
import { lookupQuery, lookupsListKey, lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { lookupFixture, pageFixture } from '@/modules/lookups/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

const lookup = (overrides: Partial<LookupObject> = {}) => lookupFixture(1, overrides)

beforeEach(() => vi.resetAllMocks())

describe('lookup queries', () => {
  it('asks the core for one searcher at a time, through the generated client', async () => {
    const page = pageFixture([lookupFixture(3, { source: 'whatsapp' })])
    vi.mocked(http).mockResolvedValue(page)
    const params = { page: 2, searcherType: 'contact' as const, searcherId: 7 }

    expect(lookupsQuery(params).queryKey).toEqual(['/api/v1/workspace/lookups', params])
    expect(await new QueryClient().fetchQuery(lookupsQuery(params))).toBe(page)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/workspace/lookups', method: 'GET' }),
      { params: { ...params, perPage: 20 } }
    )
    expect(axios.getUri({ url: '/lookups', params: withPerPage(params) })).toBe(
      '/lookups?page=2&searcherType=contact&searcherId=7&perPage=20'
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
    expect(query.select(response)).toMatchObject({ id: 9, status: 'done' })
  })

  it('never polls, the live stream refreshes them', () => {
    expect(lookupsQuery({ page: 1 })).not.toHaveProperty('refetchInterval')
    expect(lookupQuery(1)).not.toHaveProperty('refetchInterval')
  })

  it('keeps the previous page while the next loads, not across searchers', () => {
    const client = new QueryClient()
    const previous = pageFixture([lookup()])
    const params = { page: 1, searcherType: 'user' as const, searcherId: 101 }
    client.setQueryData(lookupsListKey(params), previous)
    const query = client.getQueryCache().find({ queryKey: lookupsListKey(params) })!
    const placeholder = (next: typeof params | PaginationParams) =>
      lookupsQuery(next).placeholderData(previous, query as never)

    expect(placeholder({ ...params, page: 2 })).toBe(previous)
    expect(placeholder({ ...params, searcherId: 102 })).toBeUndefined()
    expect(placeholder({ page: 1 })).toBeUndefined()
    expect(lookupsQuery(params).placeholderData()).toBeUndefined()
  })
})
