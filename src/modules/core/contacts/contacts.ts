import { z } from 'zod'
import type { ContactObject } from '@/core/api/models'
import type { ConfirmFact, ConfirmSpec } from '@/modules/core/shared/confirm'
import { formatDate, formatPhone, formatWhen } from '@/modules/core/shared/format'
import { type Message, message } from '@/modules/core/shared/message'
import type { Me } from '@/modules/core/workspace/workspace'

export const contactStatuses = ['active', 'blocked'] as const

export type ContactStatus = (typeof contactStatuses)[number]

export const contactTabs = ['all', ...contactStatuses] as const

export type ContactTab = (typeof contactTabs)[number]

export const contactsSearchSchema = z.object({
  status: z.enum(contactStatuses).optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})

export type ContactsSearch = z.infer<typeof contactsSearchSchema>

export type ContactRow = {
  contact: ContactObject
  name: string
  whatsappName: string | null
  phone: string
  statusLabel: Message
  tone: 'success' | 'danger'
  added: string
  searches: { total: number; month: number }
  lastSearch: Message | null
  actions: { rename: boolean; block: boolean; unblock: boolean; remove: boolean }
}

const TONES = { active: 'success', blocked: 'danger' } as const

export function tabStatus(tab: string): ContactStatus | undefined {
  return contactStatuses.find((status) => status === tab)
}

export function contactName(contact: ContactObject) {
  return contact.name ?? contact.profileName ?? formatPhone(contact.waId)
}

export function contactRow(contact: ContactObject, me: Me, now: Date, locale?: string): ContactRow {
  const manage = me.permissions.manageContacts

  return {
    contact,
    name: contactName(contact),
    whatsappName: contact.name && contact.profileName !== contact.name ? contact.profileName : null,
    phone: formatPhone(contact.waId),
    statusLabel: message(`contacts.status.${contact.status}`),
    tone: TONES[contact.status],
    added: formatDate(contact.createdAt, locale),
    searches: { total: contact.lookupsCount, month: contact.monthLookupsCount },
    lastSearch: contact.lastLookupAt ? formatWhen(contact.lastLookupAt, now, locale) : null,
    actions: {
      rename: manage,
      block: manage && contact.status === 'active',
      unblock: manage && contact.status === 'blocked',
      remove: manage,
    },
  }
}

function contactFacts(row: ContactRow): ConfirmFact[] {
  return [
    { label: message('contacts.facts.phone'), value: row.phone },
    { label: message('contacts.facts.added'), value: row.added },
  ]
}

export function blockConfirm(row: ContactRow): ConfirmSpec {
  return {
    title: message('contacts.confirm.block.title', { name: row.name }),
    body: message('contacts.confirm.block.body'),
    action: message('contacts.confirm.block.action'),
    tone: 'danger',
    facts: contactFacts(row),
  }
}

export function removeContactConfirm(row: ContactRow): ConfirmSpec {
  return {
    title: message('contacts.confirm.remove.title', { name: row.name }),
    body: message('contacts.confirm.remove.body'),
    action: message('contacts.confirm.remove.action'),
    tone: 'danger',
    facts: contactFacts(row),
  }
}
