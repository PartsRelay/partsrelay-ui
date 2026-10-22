import { z } from 'zod'
import type { ContactObject } from '@/core/api/models'
import type { Role } from '@/modules/workspaces/core/role'

export type Contact = ContactObject
export const contactStatuses = ['active', 'blocked'] as const
export type ContactStatus = (typeof contactStatuses)[number]
export const contactsSearchSchema = z.object({
  status: z.enum(contactStatuses).optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})
export type ContactsSearch = z.infer<typeof contactsSearchSchema>

export function canManageContacts(role: Role) {
  return role === 'owner' || role === 'admin'
}

export function contactName(contact: Contact) {
  return contact.name?.trim() || contact.profileName?.trim() || null
}

export function formatContactDate(value: string | null, locale: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function normalizePhone(phone: string) {
  const normalized = phone.replace(/[\s().-]/g, '').replace(/^00/, '+')
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null
}

export function validateContact(phone: string, name: string) {
  const normalized = normalizePhone(phone)
  const cleanName = name.trim()
  return {
    body:
      normalized && cleanName.length <= 255
        ? { phone: normalized, ...(cleanName ? { name: cleanName } : {}) }
        : null,
    errors: {
      phone: normalized ? null : 'contacts.form.phone-error',
      name: cleanName.length > 255 ? 'contacts.form.name-error' : null,
    },
  }
}

export function validateContactName(name: string) {
  const clean = name.trim()
  return clean.length <= 255 ? { name: clean || null } : null
}
