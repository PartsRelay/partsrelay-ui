import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { getApiV1LookupsLookupId } from '@/core/api/endpoints/lookups/lookups'
import { getApiV1WorkspaceLookups } from '@/core/api/endpoints/workspace-lookups/workspace-lookups'
import type { LookupObject } from '@/core/api/models'
import {
  type Search,
  searchDetail,
  searcherName,
  searchRow,
  searchState,
  toSearch,
} from '@/modules/core/searches/search'
import {
  RUNNING_REFRESH,
  searchKeys,
  searchQuery,
  searchesQuery,
} from '@/modules/core/searches/searches.query'
import { formatPrice } from '@/modules/core/shared/format'
import { message } from '@/modules/core/shared/message'
import { companyFixture, lookupFixture, pageFixture } from '@/modules/core/testing/fixtures'

vi.mock('@/core/api/endpoints/lookups/lookups', () => ({ getApiV1LookupsLookupId: vi.fn() }))
vi.mock('@/core/api/endpoints/workspace-lookups/workspace-lookups', () => ({
  getApiV1WorkspaceLookups: vi.fn(),
}))

const workspace = companyFixture()
const now = new Date(2026, 9, 12, 12, 0)
const search = (overrides: Partial<LookupObject> = {}) =>
  toSearch(
    lookupFixture(1, { createdAt: new Date(2026, 9, 12, 9, 59).toISOString(), ...overrides })
  )

beforeEach(() => vi.resetAllMocks())

describe('search', () => {
  it('maps a done search with its categories, units and parts', () => {
    const done = search()

    expect(done).toMatchObject({
      id: 1,
      plate: 'CA770NE',
      vin: 'ZFA31200003456789',
      vehicle: 'Fiat Panda 1.2',
      nodeIds: ['g1'],
      status: 'done',
      source: 'web',
    })
    expect(done.createdAt).toBeInstanceOf(Date)
    expect(done.categories?.[0]?.units[0]?.original[0]?.aftermarket).toHaveLength(2)
    expect(
      toSearch(lookupFixture(2, { vehicleDescription: undefined, searcher: undefined }))
    ).toMatchObject({ vehicle: null, searcher: null })
  })

  it('tells a done search with details from one whose details are missing', () => {
    expect(searchState(search())).toBe('results')
    expect(searchState(search({ categories: undefined }))).toBe('unavailable')
    expect(searchState(search({ status: 'running', categories: undefined }))).toBe('running')
    expect(searchState(search({ status: 'vehicle_not_found', vin: null }))).toBe(
      'vehicle_not_found'
    )
    expect(searchState(search({ status: 'not_matched' }))).toBe('not_matched')
    expect(searchState(search({ status: 'failed' }))).toBe('failed')
  })

  it('names who searched, also when they are gone', () => {
    const name = (searcher: LookupObject['searcher']) => searcherName(searcher ?? null, workspace)

    expect(name({ type: 'user', id: 102, name: 'Giulia Bianchi' })).toBe('Giulia Bianchi')
    expect(name({ type: 'user', id: 102, name: '' })).toBe('giulia@ricambirossi.it')
    expect(name({ type: 'user', id: 999, name: '' })).toEqual(message('searches.searcher.member'))
    expect(name({ type: 'contact', id: 3, name: 'Officina Verdi' })).toBe('Officina Verdi')
    expect(name({ type: 'contact', id: 3, name: null })).toEqual(
      message('searches.searcher.unnamedContact')
    )
    expect(name(null)).toEqual(message('searches.searcher.gone'))
  })

  it('describes a row with its status, source and time', () => {
    const row = (overrides: Partial<LookupObject>) => searchRow(search(overrides), workspace, now)

    expect(searchRow(search(), workspace, now, 'en')).toEqual({
      id: 1,
      plate: 'CA770NE',
      vehicle: 'Fiat Panda 1.2',
      statusLabel: message('searches.status.done'),
      tone: 'success',
      sourceLabel: message('searches.source.web'),
      searcher: 'Marco Rossi',
      requested: message('format.todayAt', { time: '09:59' }),
    })
    expect(row({ status: 'running' })).toMatchObject({
      statusLabel: message('searches.status.running'),
      tone: 'warning',
    })
    for (const status of ['vehicle_not_found', 'not_matched', 'failed'] as const) {
      expect(row({ status })).toMatchObject({
        statusLabel: message(`searches.status.${status}`),
        tone: 'danger',
      })
    }
    expect(row({ source: 'whatsapp' }).sourceLabel).toEqual(message('searches.source.whatsapp'))
  })

  it('shows the parts of each category with prices to confirm', () => {
    const detail = searchDetail(search(), workspace, now, 'en')

    expect(detail).toMatchObject({
      vin: 'ZFA31200003456789',
      state: 'results',
      announcement: message('searches.outcome.results.title'),
    })
    expect(detail.categories).toEqual([
      {
        id: 'g1',
        name: 'Filtro olio',
        counts: { original: 1, aftermarket: 2 },
        units: [
          {
            key: 'g1:0',
            code: 'u1',
            name: 'Filtro olio motore',
            imageUrl: 'https://images.example/u1.jpg',
            parts: [
              {
                code: '03L115562',
                name: 'Filtro olio',
                price: '-',
                aftermarket: [
                  {
                    code: 'HU 7008 z',
                    brand: 'MANN-FILTER',
                    description: 'Filtro olio',
                    price: '-',
                  },
                  { code: 'F 026 407 157', brand: 'BOSCH', description: null, price: '-' },
                ],
              },
            ],
          },
        ],
      },
    ])
  })

  it('names a category by its id when the catalog has no name', () => {
    const unnamed = search({ categories: [{ id: 'g4', name: null, units: [] }] })

    expect(searchDetail(unnamed, workspace, now).categories[0]).toMatchObject({
      name: 'g4',
      counts: { original: 0, aftermarket: 0 },
    })
    expect(searchDetail(search({ categories: undefined }), workspace, now)).toMatchObject({
      state: 'unavailable',
      categories: [],
    })
  })

  it('writes a missing price as a dash, ready for real prices', () => {
    expect(formatPrice(null)).toBe('-')
    expect(formatPrice(12.5, 'en')).toBe('12.50')
    expect(formatPrice(1234.5, 'it')).toBe('1234,50')
  })
})

describe('search queries', () => {
  const page = (searches: Search[]) => ({ searches, metadata: pageFixture([]).metadata })

  it('asks the core for one searcher at a time', async () => {
    const lookups = pageFixture([lookupFixture(3, { source: 'whatsapp' })])
    vi.mocked(getApiV1WorkspaceLookups).mockResolvedValue(lookups)
    const params = { page: 2, perPage: 20, searcherType: 'contact' as const, searcherId: 7 }

    const result = await new QueryClient().fetchQuery(searchesQuery(params))

    expect(getApiV1WorkspaceLookups).toHaveBeenCalledWith({ params })
    expect(result.searches.map((item) => item.id)).toEqual([3])
    expect(searchesQuery(params).queryKey).toEqual(searchKeys.list(params))
    expect(axios.getUri({ url: '/lookups', params })).toBe(
      '/lookups?page=2&perPage=20&searcherType=contact&searcherId=7'
    )
  })

  it('loads one search by id', async () => {
    vi.mocked(getApiV1LookupsLookupId).mockResolvedValue({ data: lookupFixture(9) })

    const result = await new QueryClient().fetchQuery(searchQuery(9))

    expect(getApiV1LookupsLookupId).toHaveBeenCalledWith('9')
    expect(result).toMatchObject({ id: 9, status: 'done' })
    expect(searchQuery(9).meta).toEqual({ silent: true })
  })

  it('polls every 15 seconds while a search runs', () => {
    const done = search()
    const running = search({ status: 'running', categories: undefined })
    const list = searchesQuery({ page: 1, perPage: 20 }).refetchInterval
    const detail = searchQuery(1).refetchInterval

    expect(RUNNING_REFRESH).toBe(15_000)
    expect(list({ state: { data: page([done, running]) } })).toBe(RUNNING_REFRESH)
    expect(list({ state: { data: page([done]) } })).toBe(false)
    expect(list({ state: {} })).toBe(false)
    expect(detail({ state: { data: running } })).toBe(RUNNING_REFRESH)
    expect(detail({ state: { data: done } })).toBe(false)
  })

  it('keeps the previous page while the next loads, not across searchers', () => {
    const client = new QueryClient()
    const previous = page([search()])
    const params = { page: 1, perPage: 20, searcherType: 'user' as const, searcherId: 101 }
    client.setQueryData(searchKeys.list(params), previous)
    const query = client.getQueryCache().find({ queryKey: searchKeys.list(params) })!
    const placeholder = (next: typeof params | { page: number; perPage: number }) =>
      searchesQuery(next).placeholderData(previous, query as never)

    expect(placeholder({ ...params, page: 2 })).toBe(previous)
    expect(placeholder({ ...params, searcherId: 102 })).toBeUndefined()
    expect(placeholder({ page: 1, perPage: 20 })).toBeUndefined()
  })
})
