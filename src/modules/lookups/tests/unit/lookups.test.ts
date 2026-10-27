import { describe, expect, it } from 'vite-plus/test'
import type { ContactObject } from '@/core/api/models'
import { message } from '@/core/message'
import {
  ALL,
  EVERYONE,
  filtered,
  filterOptions,
  filterValues,
  lookupListParams,
  lookupsSearchSchema,
  requesterOptions,
  requesterSearch,
  requesterValue,
} from '@/modules/lookups/core/lookups'
import { workspaceFixture } from '@/modules/lookups/tests/unit/fixtures'

const contact = (id: number, name: string | null, profileName: string | null): ContactObject => ({
  id,
  waId: `4477009001${id}`,
  name,
  profileName,
  status: 'active',
  createdAt: new Date(2026, 0, 1).toISOString(),
  lookupsCount: 0,
  monthLookupsCount: 0,
  lastLookupAt: null,
})

describe('searches address', () => {
  it('keeps the page, the filters and the new search sheet', () => {
    const search = {
      page: 2,
      searcherType: 'contact',
      searcherId: 7,
      search: 'ca770',
      status: 'failed',
      source: 'whatsapp',
      days: 30,
      new: true,
      plate: 'AB123CD',
      vin: 'WVWZZZAUZHW204411',
      query: 'Oil filter',
    }

    expect(lookupsSearchSchema.parse({})).toEqual({ page: 1 })
    expect(lookupsSearchSchema.parse(search)).toEqual(search)
  })

  it('drops what the core would refuse', () => {
    expect(
      lookupsSearchSchema.parse({
        page: 0,
        searcherType: 'robot',
        searcherId: -1,
        new: 'yes',
        status: 'lost',
        source: 'fax',
        days: 45,
      })
    ).toEqual({ page: 1 })
  })

  it('tells a filtered queue from the whole one', () => {
    expect(filtered({})).toBe(false)
    expect(filtered({ days: 7 })).toBe(true)
    expect(filtered({ search: 'CA' })).toBe(true)
  })

  it('asks the core for one requester only when both its type and id are known', () => {
    expect(lookupListParams({ page: 2, searcherType: 'user', searcherId: 101 })).toEqual({
      page: 2,
      searcherType: 'user',
      searcherId: 101,
    })
    expect(lookupListParams({ page: 1, searcherType: 'user' })).toEqual({ page: 1 })
    expect(lookupListParams({ page: 1, searcherId: 101 })).toEqual({ page: 1 })
  })

  it('asks the core for the searched plate or VIN, the status, the channel and the period', () => {
    expect(
      lookupListParams({
        page: 1,
        search: 'CA7',
        status: 'done',
        source: 'web',
        days: 7,
        new: true,
        plate: 'AB123CD',
      })
    ).toEqual({ page: 1, search: 'CA7', status: 'done', source: 'web', days: 7 })
  })
})

describe('queue filters', () => {
  it('offers every status, channel and period, after all of them', () => {
    expect(filterOptions.status[0]).toEqual({ value: ALL, label: message('lookups.filter.all') })
    expect(filterOptions.status).toContainEqual({
      value: 'vehicle_not_found',
      label: message('lookups.status.vehicle-not-found'),
    })
    expect(filterOptions.source.map(({ value }) => value)).toEqual([ALL, 'web', 'whatsapp'])
    expect(filterOptions.days.map(({ value }) => value)).toEqual([ALL, '7', '30', '90'])
    expect(filterOptions.days[1]).toEqual({
      value: '7',
      label: message('lookups.filter.days', { days: 7 }),
    })
  })

  it('reads the chosen option back, all of them as no filter', () => {
    expect(filterValues.status('failed')).toBe('failed')
    expect(filterValues.status(ALL)).toBeUndefined()
    expect(filterValues.source('whatsapp')).toBe('whatsapp')
    expect(filterValues.days('30')).toBe(30)
    expect(filterValues.days(ALL)).toBeUndefined()
  })
})

describe('requester filter', () => {
  it('turns a requester into one option value and back', () => {
    expect(requesterValue({ searcherType: 'contact', searcherId: 7 })).toBe('contact:7')
    expect(requesterValue({})).toBe(EVERYONE)
    expect(requesterSearch('contact:7')).toEqual({ searcherType: 'contact', searcherId: 7 })
    expect(requesterSearch(EVERYONE)).toEqual({})
    expect(requesterSearch('user:abc')).toEqual({})
    expect(requesterSearch('robot:7')).toEqual({})
  })

  it('offers the team and the WhatsApp contacts by name', () => {
    const contacts = [
      contact(3, null, 'Hillside Auto Repair'),
      contact(1, 'Oakfield Garage', 'Tom Walker'),
    ]

    expect(requesterOptions(workspaceFixture(), contacts)).toEqual({
      members: [
        { value: 'user:102', label: 'Julia White' },
        { value: 'user:103', label: 'Luke Ford' },
        { value: 'user:101', label: 'Mark Reed' },
      ],
      contacts: [
        { value: 'contact:3', label: 'Hillside Auto Repair' },
        { value: 'contact:1', label: 'Oakfield Garage' },
      ],
    })
  })
})
