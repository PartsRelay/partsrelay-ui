import { describe, expect, it } from 'vite-plus/test'
import {
  requesterName,
  searchFormSchema,
  searchListSchema,
  searchParams,
  searchState,
  visibleSearches,
  type Search,
} from '@/modules/searches/core/search'

const record = (values: Partial<Search> = {}): Search => ({
  id: 17,
  plate: 'GH482KL',
  vin: null,
  nodeIds: [],
  status: 'running',
  source: 'web',
  createdAt: '2026-10-21T12:00:00Z',
  ...values,
})

describe('new search validation', () => {
  it('normalizes a formatted plate and trims the part description', () => {
    expect(
      searchFormSchema.parse({ plate: ' gh-482. kl ', query: '  front brake pads  ' })
    ).toEqual({
      plate: 'GH482KL',
      query: 'front brake pads',
    })
  })

  it.each(['ABC', 'ABCDEFGHI', 'GH/482KL', 'GH_482KL', 'GH482ÉL', ''])(
    'rejects unsupported plate %s',
    (plate) => {
      expect(searchFormSchema.safeParse({ plate, query: 'brakes' }).success).toBe(false)
    }
  )

  it('enforces description bounds after trimming and keeps valid boundary values', () => {
    for (const query of [' ', ' a ', 'a'.repeat(201)]) {
      expect(searchFormSchema.safeParse({ plate: 'GH482KL', query }).success).toBe(false)
    }
    for (const query of ['ab', 'a'.repeat(200)]) {
      expect(searchFormSchema.safeParse({ plate: 'GH482KL', query }).success).toBe(true)
    }
  })
})

describe('history filters', () => {
  it('recovers malformed URL filters without sending invalid API parameters', () => {
    expect(
      searchListSchema.parse({
        page: '-3',
        requester: 'owner',
        person: 'invalid',
        newSearch: 'yes',
      })
    ).toEqual({
      page: 1,
      requester: 'all',
      person: undefined,
      newSearch: undefined,
    })
    expect(
      searchListSchema.parse({ page: '2', requester: 'contact', person: '12', newSearch: true })
    ).toEqual({
      page: 2,
      requester: 'contact',
      person: 12,
      newSearch: true,
    })
  })

  it('sends requester type and ID together and removes a stale ID for everyone', () => {
    expect(searchParams({ page: 3, requester: 'all', person: 12, newSearch: true })).toEqual({
      page: 3,
      perPage: 20,
    })
    expect(searchParams({ page: 1, requester: 'contact', person: 12 })).toEqual({
      page: 1,
      perPage: 20,
      searcherType: 'contact',
      searcherId: 12,
    })
    expect(searchParams({ page: 1, requester: 'user' })).toEqual({
      page: 1,
      perPage: 20,
      searcherType: 'user',
    })
  })

  it('applies text and status to only the provided page without mutating it', () => {
    const page = [
      record({ status: 'done', vehicleDescription: 'Fiat Panda' }),
      record({ id: 18, status: 'failed', plate: 'AB123CD', vehicleDescription: 'Fiat Punto' }),
    ]
    expect(visibleSearches(page, ' fiat ', 'done').map(({ id }) => id)).toEqual([17])
    expect(visibleSearches(page, 'AB123', 'all').map(({ id }) => id)).toEqual([18])
    expect(page).toHaveLength(2)
  })

  it('does not resolve a workshop contact to a team member with the same numeric ID', () => {
    const members = [{ userId: '12', name: 'Team member', email: 'member@example.com' }]
    expect(
      requesterName(
        record({ searcher: { id: 12, type: 'contact', name: null } }),
        members,
        'Former requester'
      )
    ).toBe('Former requester')
    expect(
      requesterName(
        record({ searcher: { id: 12, type: 'user', name: null } }),
        members,
        'Former requester'
      )
    ).toBe('Team member')
  })
})

describe('search outcomes', () => {
  it.each(['running', 'vehicle_not_found', 'not_matched', 'failed'] as const)(
    'preserves the backend outcome %s',
    (status) => {
      expect(searchState(record({ status }))).toBe(status)
    }
  )

  it('shows unavailable details for completed history whose catalogue result expired', () => {
    expect(searchState(record({ status: 'done' }))).toBe('unavailable')
    expect(
      searchState(
        record({ status: 'done', categories: [{ id: 'brakes', name: 'Brakes', units: [] }] })
      )
    ).toBe('unavailable')
  })

  it('recognizes original references as results even without aftermarket matches or prices', () => {
    expect(
      searchState(
        record({
          status: 'done',
          categories: [
            {
              id: 'brakes',
              name: 'Brakes',
              units: [
                {
                  code: null,
                  name: null,
                  imageUrl: null,
                  original: [{ code: '77367141', name: null, price: null, aftermarket: [] }],
                },
              ],
            },
          ],
        })
      )
    ).toBe('results')
  })
})
