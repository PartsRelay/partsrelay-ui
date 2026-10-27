import { describe, expect, it } from 'vite-plus/test'
import type { LookupObject } from '@/core/api/models'
import { message } from '@/core/message'
import { lookupDetail, lookupState } from '@/modules/lookups/core/lookup-detail'
import { lookupRow } from '@/modules/lookups/core/lookup-row'
import { lookupFixture } from '@/modules/lookups/tests/unit/fixtures'

const lookup = (overrides: Partial<LookupObject> = {}) => lookupFixture(1, overrides)

describe('lookup detail', () => {
  it('tells done lookups with details from those whose details are missing', () => {
    expect(lookupState(lookup())).toBe('results')
    expect(lookupState(lookup({ categories: undefined }))).toBe('unavailable')
    expect(lookupState(lookup({ status: 'running', categories: undefined }))).toBe('running')
    expect(lookupState(lookup({ status: 'vehicle_not_found', vin: null }))).toBe(
      'vehicle_not_found'
    )
    expect(lookupState(lookup({ status: 'not_matched' }))).toBe('not_matched')
    expect(lookupState(lookup({ status: 'failed' }))).toBe('failed')
  })

  it('starts a new search with the plate, or the VIN, and the part', () => {
    const retry = (overrides: Partial<LookupObject>) =>
      lookupDetail(lookup(overrides), 'en-US').retry

    expect(retry({})).toEqual({ plate: 'AB12CDE', query: 'Oil filter change' })
    expect(retry({ plate: null, query: null })).toEqual({ vin: 'WF0FXXGCDFKA12345' })
  })

  it('announces the outcome in kebab case keys', () => {
    const announcement = (overrides: Partial<LookupObject>) =>
      lookupDetail(lookup(overrides), 'en-US').announcement

    expect(announcement({})).toEqual(message('lookups.outcome.results.title'))
    expect(announcement({ categories: undefined })).toEqual(
      message('lookups.outcome.unavailable.title')
    )
    expect(announcement({ status: 'vehicle_not_found' })).toEqual(
      message('lookups.outcome.vehicle-not-found.title')
    )
    expect(announcement({ status: 'not_matched' })).toEqual(
      message('lookups.outcome.not-matched.title')
    )
  })

  it('shows the parts of each category', () => {
    const done = lookup()
    const detail = lookupDetail(done, 'en-US')

    expect(detail).toMatchObject({
      ...lookupRow(done, 'en-US'),
      vin: 'WF0FXXGCDFKA12345',
      state: 'results',
    })
    expect(detail.categories).toEqual([
      {
        id: 'g1',
        name: 'Oil filter',
        counts: { original: 1, aftermarket: 2 },
        units: [
          {
            key: 'g1:0',
            code: 'u1',
            name: 'Engine oil filter',
            imageUrl: 'https://images.example/u1.jpg',
            parts: [
              {
                code: '2116445',
                name: 'Oil filter',
                aftermarket: [
                  { code: 'W 7015', brand: 'MANN-FILTER', description: 'Oil filter' },
                  { code: 'F 026 407 209', brand: 'BOSCH', description: null },
                ],
              },
            ],
          },
        ],
      },
    ])
  })

  it('names a category by its id when the catalog has no name', () => {
    const unnamed = lookup({ categories: [{ id: 'g4', name: null, units: [] }] })

    expect(lookupDetail(unnamed, 'en-US').categories[0]).toMatchObject({
      name: 'g4',
      counts: { original: 0, aftermarket: 0 },
    })
    expect(lookupDetail(lookup({ categories: undefined }), 'en-US')).toMatchObject({
      state: 'unavailable',
      categories: [],
    })
  })
})
