import { describe, expect, it } from 'vitest'
import {
  canManageContacts,
  contactsSearchSchema,
  normalizePhone,
  validateContact,
  validateContactName,
} from '@/modules/contacts/core/contacts'

describe('workshop contact input', () => {
  it('normalizes international separators without discarding an Italian landline zero', () => {
    expect(normalizePhone('+39 (06) 1234-5678')).toBe('+390612345678')
    expect(normalizePhone('0039 333 123 4567')).toBe('+393331234567')
    expect(normalizePhone('+1 (202) 555-0142')).toBe('+12025550142')
  })

  it('requires an international number and rejects extra digits or text', () => {
    for (const phone of [
      '3331234567',
      '+012345678',
      '+3933',
      '+1234567890123456',
      '+393331234567 ext 4',
    ]) {
      expect(normalizePhone(phone)).toBeNull()
    }
  })

  it('omits a blank optional name on create and clears it explicitly on edit', () => {
    expect(validateContact('+39 333 1234567', '   ').body).toEqual({ phone: '+393331234567' })
    expect(validateContactName('   ')).toEqual({ name: null })
    expect(validateContactName('  Officina Rossi  ')).toEqual({ name: 'Officina Rossi' })
    expect(validateContactName('x'.repeat(256))).toBeNull()
  })
})

describe('contact access and filters', () => {
  it('allows owners and admins to manage contacts while viewers can only read', () => {
    expect(canManageContacts('owner')).toBe(true)
    expect(canManageContacts('admin')).toBe(true)
    expect(canManageContacts('viewer')).toBe(false)
  })

  it('recovers unsupported approval filters and invalid pages to the default directory', () => {
    expect(contactsSearchSchema.parse({ status: 'pending', page: -1 })).toEqual({
      status: undefined,
      page: 1,
    })
    expect(contactsSearchSchema.parse({ status: 'blocked', page: 3 })).toEqual({
      status: 'blocked',
      page: 3,
    })
  })
})
