import { describe, expect, it } from 'vite-plus/test'
import { fieldErrors } from '@/core/errors'
import { contactFieldErrors, newContact, renameChange } from '@/modules/contacts/core/contact-form'
import { contactFixture, coreError } from '@/modules/contacts/tests/unit/fixtures'

describe('new contact', () => {
  it('sends the number as typed and a trimmed optional name', () => {
    expect(newContact({ phone: ' 0044 7700 900103 ', name: '  Oakfield Garage ' })).toEqual({
      phone: '0044 7700 900103',
      name: 'Oakfield Garage',
    })
    expect(newContact({ phone: '+44 7700 900103', name: '   ' })).toEqual({
      phone: '+44 7700 900103',
    })
  })

  it('shows each error under the field the core names', () => {
    const taken = coreError(422, 'VALIDATION_ERROR', [{ field: 'phone', rule: 'database.unique' }])
    const both = coreError(422, 'VALIDATION_ERROR', [
      { field: 'phone', rule: 'waId' },
      { field: 'name', rule: 'maxLength' },
    ])

    expect(fieldErrors(taken, contactFieldErrors)).toEqual({ phone: 'contacts.add.errors.phone' })
    expect(fieldErrors(both, contactFieldErrors)).toEqual({
      phone: 'contacts.add.errors.phone',
      name: 'contacts.add.errors.name',
    })
    expect(fieldErrors(coreError(403, 'AUTHORIZATION_FAILURE'), contactFieldErrors)).toBeNull()
  })
})

describe('rename', () => {
  it('sends only real changes and clears with an empty name', () => {
    const contact = contactFixture(4, { name: 'Westfield Car Care' })

    expect(renameChange(' Westfield Car Care ', contact)).toBeNull()
    expect(renameChange('   ', contact)).toEqual({ name: null })
    expect(renameChange(' Westfield Motors', contact)).toEqual({ name: 'Westfield Motors' })
    expect(renameChange('', contactFixture(5))).toBeNull()
  })
})
