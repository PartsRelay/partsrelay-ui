import { describe, expect, it } from 'vite-plus/test'
import { checkContact, createContactForm, toWaId } from '@/modules/core/contacts/contact-form'
import { literal, message } from '@/modules/core/shared/message'
import { axiosError } from '@/modules/core/testing/fixtures'

describe('phone numbers', () => {
  it('normalises like the core', () => {
    expect(toWaId('+39 338 473 2036')).toBe('393384732036')
    expect(toWaId('0039 338 473 2036')).toBe('393384732036')
    expect(toWaId('+44 (0)20 7946-0958')).toBe('442079460958')
    expect(toWaId('+39.338.473.2036')).toBe('393384732036')
    expect(toWaId(' +49 (151) 1234 5678 ')).toBe('4915112345678')
  })

  it('needs the international prefix and 8 to 15 digits', () => {
    expect(toWaId('338 473 2036')).toBeNull()
    expect(toWaId('+0 338 473 2036')).toBeNull()
    expect(toWaId('+1234567')).toBeNull()
    expect(toWaId('+12345678')).toBe('12345678')
    expect(toWaId('+123456789012345')).toBe('123456789012345')
    expect(toWaId('+1234567890123456')).toBeNull()
    expect(toWaId('+39 338 ABC 2036')).toBeNull()
  })
})

describe('new contact', () => {
  it('sends the normalised number and a trimmed optional name', () => {
    expect(checkContact('0039 338 473 2036', '  Officina Verdi ')).toEqual({
      contact: { phone: '+393384732036', name: 'Officina Verdi' },
      errors: {},
    })
    expect(checkContact('+39 338 473 2036', '   ').contact).toEqual({ phone: '+393384732036' })
  })

  it('explains what is wrong before asking the core', () => {
    expect(checkContact(' ', '').errors).toEqual({
      phone: message('contacts.add.errors.phoneRequired'),
    })
    expect(checkContact('338 473 2036', 'x'.repeat(256))).toEqual({
      contact: null,
      errors: {
        phone: message('contacts.add.errors.phone'),
        name: message('contacts.errors.nameTooLong', { max: 255 }),
      },
    })
  })

  it('shows the core validation under each field', () => {
    const form = createContactForm()
    form.actions.setPhone('+39 338 473 2036')

    expect(form.actions.submit()).toEqual({ phone: '+393384732036' })

    const taken = axiosError(422, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload failed validation',
        details: [
          {
            field: 'phone',
            rule: 'database.unique',
            message: 'The phone number is already in use',
          },
        ],
      },
    })
    expect(form.actions.failed(taken)).toBe('phone')
    expect(form.state).toMatchObject({
      errors: { phone: literal('errors.VALIDATION_ERROR', 'The phone number is already in use') },
      failure: null,
    })

    form.actions.setPhone('+39 338 473 2037')
    expect(form.state.errors.phone).toBeUndefined()
  })

  it('shows other failures above the fields', () => {
    const form = createContactForm()
    const refused = axiosError(403, {
      error: { code: 'AUTHORIZATION_FAILURE', message: 'You are not allowed to do this' },
    })

    expect(form.actions.failed(refused)).toBeNull()
    expect(form.state.failure).toEqual(
      literal('errors.AUTHORIZATION_FAILURE', 'You are not allowed to do this')
    )
    expect(form.actions.submit()).toBeNull()
    expect(form.state.failure).toBeNull()
  })
})
