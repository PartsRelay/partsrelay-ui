import { describe, expect, it } from 'vite-plus/test'
import type { LookupObject } from '@/core/api/models'
import { message } from '@/core/message'
import { lookupRow, searcherName } from '@/modules/lookups/core/lookup-row'
import { lookupFixture } from '@/modules/lookups/tests/unit/fixtures'

const row = (overrides: Partial<LookupObject> = {}) =>
  lookupRow(lookupFixture(1, overrides), 'en-US')

describe('lookup rows', () => {
  it('shows the plate, the part, the vehicle, who searched and when', () => {
    const lookup = lookupFixture(1)

    expect(lookupRow(lookup, 'en-US')).toEqual({
      lookup,
      identifier: 'AB12CDE',
      part: 'Oil filter change',
      vehicle: 'Ford Fiesta 1.0',
      statusLabel: message('lookups.status.done'),
      tone: 'success',
      sourceLabel: message('lookups.source.web'),
      searcher: 'Mark Reed',
      requested: expect.stringMatching(/^Oct 12, 2026, 9:59\sAM$/u),
    })
    expect(row({ vehicleDescription: undefined }).vehicle).toBeNull()
    expect(row({ vehicleDescription: null }).vehicle).toBeNull()
  })

  it('names a search by its VIN when it has no plate', () => {
    expect(row({ plate: null }).identifier).toBe('WF0FXXGCDFKA12345')
  })

  it('names the parts found when the requested part is unknown, by id without a name', () => {
    const categories = [
      { id: 'g1', name: 'Oil filter', units: [] },
      { id: 'g9', name: null, units: [] },
    ]

    expect(row({ query: null, categories }).part).toBe('Oil filter, g9')
    expect(row({ query: null, status: 'running', categories: undefined }).part).toBeNull()
  })

  it('dates the lookup in the app language', () => {
    expect(lookupRow(lookupFixture(1), 'it-IT').requested).toBe('12 ott 2026, 09:59')
  })

  it('gives each status its label and tone', () => {
    expect(row({ status: 'running' })).toMatchObject({
      statusLabel: message('lookups.status.running'),
      tone: 'warning',
    })
    expect(row({ status: 'vehicle_not_found' }).statusLabel).toEqual(
      message('lookups.status.vehicle-not-found')
    )
    expect(row({ status: 'not_matched' }).statusLabel).toEqual(
      message('lookups.status.not-matched')
    )
    for (const status of ['vehicle_not_found', 'not_matched', 'failed'] as const) {
      expect(row({ status }).tone).toBe('danger')
    }
    expect(row({ source: 'whatsapp' }).sourceLabel).toEqual(message('lookups.source.whatsapp'))
  })

  it('names who searched, also when they are gone', () => {
    const name = (searcher: LookupObject['searcher']) => searcherName(searcher ?? null)

    expect(name({ type: 'user', id: 102, name: 'Julia White' })).toBe('Julia White')
    expect(name({ type: 'contact', id: 3, name: 'Oakfield Garage' })).toBe('Oakfield Garage')
    expect(name({ type: 'contact', id: 3, name: null })).toEqual(
      message('lookups.searcher.unnamed-contact')
    )
    expect(name(null)).toEqual(message('lookups.searcher.gone'))
    expect(row({ searcher: undefined }).searcher).toEqual(message('lookups.searcher.gone'))
  })
})
