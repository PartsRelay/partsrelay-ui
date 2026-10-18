import { createStore } from '@tanstack/store'
import { CONTACT_NAME_MAX } from '@/modules/core/contacts/rename'
import { errorMessage, fieldErrors } from '@/modules/core/shared/errors'
import { type Message, message } from '@/modules/core/shared/message'

const INTERNATIONAL = /^\+[1-9]\d{7,14}$/

export type NewContact = { phone: string; name?: string }

type ContactField = 'phone' | 'name'

export type ContactDraft = {
  phone: string
  name: string
  errors: Partial<Record<ContactField, Message>>
  failure: Message | null
}

// Same rule as the core: +39 (0)338 473-2036 becomes 393384732036
export function toWaId(phone: string) {
  const international = phone
    .replace(/\(0\)/g, '')
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+')

  return INTERNATIONAL.test(international) ? international.slice(1) : null
}

export function checkContact(phone: string, name: string) {
  const errors: ContactDraft['errors'] = {}
  const waId = toWaId(phone)
  const trimmed = name.trim()

  if (phone.trim() === '') errors.phone = message('contacts.add.errors.phoneRequired')
  else if (!waId) errors.phone = message('contacts.add.errors.phone')
  if (trimmed.length > CONTACT_NAME_MAX) {
    errors.name = message('contacts.errors.nameTooLong', { max: CONTACT_NAME_MAX })
  }

  const contact: NewContact | null =
    waId && !errors.name ? { phone: `+${waId}`, ...(trimmed && { name: trimmed }) } : null

  return { contact, errors }
}

const empty: ContactDraft = { phone: '', name: '', errors: {}, failure: null }

export function createContactForm() {
  return createStore<ContactDraft, ContactFormActions>(empty, ({ setState, get }) => ({
    setPhone: (phone) =>
      setState((draft) => ({ ...draft, phone, errors: { ...draft.errors, phone: undefined } })),
    setName: (name) =>
      setState((draft) => ({ ...draft, name, errors: { ...draft.errors, name: undefined } })),
    submit: () => {
      const { contact, errors } = checkContact(get().phone, get().name)
      setState((draft) => ({ ...draft, errors, failure: null }))

      return contact
    },
    failed: (error) => {
      const { phone, name } = fieldErrors(error)
      const errors = { ...(phone && { phone }), ...(name && { name }) }
      const failure = phone || name ? null : errorMessage(error)
      setState((draft) => ({ ...draft, errors, failure }))

      return phone ? 'phone' : name ? 'name' : null
    },
    reset: () => setState(() => empty),
  }))
}

type ContactFormActions = {
  setPhone: (phone: string) => void
  setName: (name: string) => void
  submit: () => NewContact | null
  failed: (error: unknown) => ContactField | null
  reset: () => void
}
