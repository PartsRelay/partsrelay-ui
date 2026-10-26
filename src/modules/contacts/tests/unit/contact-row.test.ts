import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/core/message'
import { contactName, contactRow } from '@/modules/contacts/core/contact-row'
import { contactFixture, meAs } from '@/modules/contacts/tests/unit/fixtures'

const owner = meAs('owner')
const admin = meAs('admin')
const viewer = meAs('viewer')

const oakfield = contactFixture(1, {
  waId: '447700900101',
  name: 'Oakfield Garage',
  profileName: 'Tom Walker',
  lookupsCount: 412,
  monthLookupsCount: 38,
  lastLookupAt: new Date(2026, 9, 14, 16, 12).toISOString(),
})

describe('contact rows', () => {
  it('shows the given name, then the WhatsApp name, then the number', () => {
    expect(contactRow(oakfield, owner, 'en-US')).toMatchObject({
      name: 'Oakfield Garage',
      whatsappName: 'Tom Walker',
      phone: '+44 7700 900101',
    })
    expect(contactRow(contactFixture(2), owner, 'en-US')).toMatchObject({
      name: 'Contact 2',
      whatsappName: null,
      phone: '+44 7700 900123',
    })
    expect(contactName(contactFixture(3, { profileName: null }))).toBe('+44 7700 900123')
    expect(
      contactRow(
        contactFixture(4, { name: 'Tom Walker', profileName: 'Tom Walker' }),
        owner,
        'en-US'
      ).whatsappName
    ).toBeNull()
  })

  it('groups the number by country and keeps unknown ones', () => {
    expect(contactName(contactFixture(5, { profileName: null, waId: '12025550106' }))).toBe(
      '+1 202 555 0106'
    )
    expect(contactName(contactFixture(6, { profileName: null, waId: '12' }))).toBe('+12')
  })

  it('counts the searches and dates them in the app language', () => {
    expect(contactRow(oakfield, owner, 'en-US')).toMatchObject({
      searches: { total: 412, month: 38 },
      statusLabel: message('contacts.status.active'),
      tone: 'success',
    })
    expect(contactRow(oakfield, owner, 'en-US').lastSearch).toMatch(/^Oct 14, 2026, 4:12\sPM$/u)
    expect(contactRow(oakfield, owner, 'it-IT').lastSearch).toBe('14 ott 2026, 16:12')
    expect(contactRow(contactFixture(2), owner, 'en-US').lastSearch).toBeNull()
    expect(contactRow(oakfield, owner, 'en-US').joined).toBe('Mar 12, 2026')
    expect(contactRow(oakfield, owner, 'it-IT').joined).toBe('12 mar 2026')
  })

  it('lets owners and admins manage contacts, viewers only read', () => {
    const blocked = contactFixture(5, { status: 'blocked' })

    expect(contactRow(oakfield, owner, 'en-US').actions).toEqual({
      rename: true,
      block: true,
      unblock: false,
      remove: true,
    })
    expect(contactRow(blocked, admin, 'en-US')).toMatchObject({
      tone: 'danger',
      statusLabel: message('contacts.status.blocked'),
      actions: { rename: true, block: false, unblock: true, remove: true },
    })
    expect(Object.values(contactRow(oakfield, viewer, 'en-US').actions)).not.toContain(true)
    expect(Object.values(contactRow(blocked, viewer, 'en-US').actions)).not.toContain(true)
  })
})
