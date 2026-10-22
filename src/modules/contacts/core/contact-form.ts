import type { ContactObject, PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import type { ContactChange } from '@/modules/contacts/core/contacts.mutation'

export type ContactValues = { phone: string; name: string }

export const emptyContact: ContactValues = { phone: '', name: '' }

// The core normalises the number, the name is optional
export function newContact({ phone, name }: ContactValues): PostApiV1WorkspaceContactsBody {
  const trimmed = name.trim()

  return trimmed ? { phone: phone.trim(), name: trimmed } : { phone: phone.trim() }
}

// The error under each field the core rejects
export const contactFieldErrors = {
  phone: 'contacts.add.errors.phone',
  name: 'contacts.add.errors.name',
}

// Only real changes, an empty name shows the WhatsApp one
export function renameChange(value: string, contact: ContactObject): ContactChange | null {
  const name = value.trim() || null

  return name === contact.name ? null : { name }
}
