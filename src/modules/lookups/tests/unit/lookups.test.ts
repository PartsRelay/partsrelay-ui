import { describe, expect, it } from 'vite-plus/test'
import type { ContactObject } from '@/core/api/models'
import { MAX_STRING_LENGTH } from '@/core/strings'
import {
  EVERYONE,
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
  it('keeps the page, the requester and the new search sheet', () => {
    expect(lookupsSearchSchema.parse({})).toEqual({ page: 1 })
    expect(
      lookupsSearchSchema.parse({
        page: 2,
        searcherType: 'contact',
        searcherId: 7,
        new: true,
        plate: 'CA770NE',
      })
    ).toEqual({ page: 2, searcherType: 'contact', searcherId: 7, new: true, plate: 'CA770NE' })
  })

  it('drops what the core would refuse', () => {
    expect(
      lookupsSearchSchema.parse({ page: 0, searcherType: 'robot', searcherId: -1, new: 'yes' })
    ).toEqual({ page: 1 })
    expect(lookupsSearchSchema.parse({ plate: 'A'.repeat(MAX_STRING_LENGTH + 1) })).toEqual({
      page: 1,
    })
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
