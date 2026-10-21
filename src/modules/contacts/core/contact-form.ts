import type { ContactObject, PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import { errorCode } from '@/core/errors'
import type { ContactChange } from '@/modules/contacts/core/contacts.mutation'

export type ContactValues = { phone: string; name: string }

export const emptyContact: ContactValues = { phone: '', name: '' }

// The longest name the core accepts
export const CONTACT_NAME_MAX = 255

// The core normalises the number, the name is optional
export function newContact({ phone, name }: ContactValues): PostApiV1WorkspaceContactsBody {
  const trimmed = name.trim()

  return trimmed ? { phone: phone.trim(), name: trimmed } : { phone: phone.trim() }
}

// The name input is capped, so 422 means the number
export function phoneError(error: unknown) {
  return errorCode(error) === 'VALIDATION_ERROR' ? 'contacts.add.errors.phone' : null
}

// Only real changes, an empty name shows the WhatsApp one
export function renameChange(value: string, contact: ContactObject): ContactChange | null {
  const name = value.trim() || null

  return name === contact.name ? null : { name }
}
