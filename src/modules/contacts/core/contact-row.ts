import { intlFormat } from 'date-fns'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import type { ContactObject } from '@/core/api/models'
import { type Message, message } from '@/core/message'
import type { Me } from '@/modules/workspaces/core/workspace'

export type ContactRow = {
  contact: ContactObject
  name: string
  whatsappName: string | null
  phone: string
  statusLabel: Message
  tone: 'success' | 'danger'
  searches: { total: number; month: number }
  lastSearch: string | null
  joined: string
  actions: { rename: boolean; block: boolean; unblock: boolean; remove: boolean }
}

const TONES = { active: 'success', blocked: 'danger' } as const

export function formatPhone(phone: string) {
  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone
}

const phoneOf = ({ waId }: ContactObject) => formatPhone(`+${waId}`)

export function contactName(contact: ContactObject) {
  return contact.name ?? contact.profileName ?? phoneOf(contact)
}

export function contactRow(contact: ContactObject, me: Me, locale: string): ContactRow {
  const manage = me.permissions.manageContacts

  return {
    contact,
    name: contactName(contact),
    whatsappName: contact.name && contact.profileName !== contact.name ? contact.profileName : null,
    phone: phoneOf(contact),
    statusLabel: message(`contacts.status.${contact.status}`),
    tone: TONES[contact.status],
    searches: { total: contact.lookupsCount, month: contact.monthLookupsCount },
    lastSearch: contact.lastLookupAt
      ? intlFormat(contact.lastLookupAt, { dateStyle: 'medium', timeStyle: 'short' }, { locale })
      : null,
    joined: intlFormat(contact.createdAt, { dateStyle: 'medium' }, { locale }),
    actions: {
      rename: manage,
      block: manage && contact.status === 'active',
      unblock: manage && contact.status === 'blocked',
      remove: manage,
    },
  }
}
