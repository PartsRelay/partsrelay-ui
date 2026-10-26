import type { ContactObject, PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import type { ContactChange } from '@/modules/contacts/core/contacts.mutation'

export type ContactValues = { phone: string; name: string }

export const emptyContact: ContactValues = { phone: '', name: '' }

export function newContact({ phone, name }: ContactValues): PostApiV1WorkspaceContactsBody {
  const trimmed = name.trim()

  return trimmed ? { phone: phone.trim(), name: trimmed } : { phone: phone.trim() }
}

export const contactFieldErrors = {
  phone: 'contacts.add.errors.phone',
}

export function renameChange(value: string, contact: ContactObject): ContactChange | null {
  const name = value.trim() || null

  return name === contact.name ? null : { name }
}
