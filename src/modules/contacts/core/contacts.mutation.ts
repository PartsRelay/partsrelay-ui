import type { QueryClient, QueryKey } from '@tanstack/query-core'
import {
  deleteApiV1WorkspaceContactsContactId,
  patchApiV1WorkspaceContactsContactId,
  postApiV1WorkspaceContacts,
} from '@/core/api/endpoints/contacts/contacts'
import type {
  ContactObject,
  PatchApiV1WorkspaceContactsContactIdBody,
  PostApiV1WorkspaceContactsBody,
} from '@/core/api/models'
import { message } from '@/core/message'
import { optimistic } from '@/core/optimistic'
import { contactName } from '@/modules/contacts/core/contact-row'
import {
  type ContactsPage,
  contactsKey,
  listParamsOf,
} from '@/modules/contacts/core/contacts.query'

export type ContactChange = PatchApiV1WorkspaceContactsContactIdBody

function withoutContact(page: ContactsPage, id: number): ContactsPage {
  if (!page.data.some((item) => item.id === id)) return page

  return {
    data: page.data.filter((item) => item.id !== id),
    metadata: { ...page.metadata, total: Math.max(0, page.metadata.total - 1) },
  }
}

function withContactChange(
  page: ContactsPage,
  key: QueryKey,
  id: number,
  change: ContactChange
): ContactsPage {
  const contact = page.data.find((item) => item.id === id)
  if (!contact) return page

  const changed: ContactObject = { ...contact, ...change }
  const status = listParamsOf(key)?.status
  if (status && !status.includes(changed.status)) return withoutContact(page, id)

  return { ...page, data: page.data.map((item) => (item.id === id ? changed : item)) }
}

export function changeNotice(contact: ContactObject, change: ContactChange) {
  const name = contactName(contact)

  if (change.status === 'blocked') return message('contacts.notices.blocked', { name })
  if (change.status === 'active') return message('contacts.notices.unblocked', { name })
  if (change.name) return message('contacts.notices.renamed', { name: change.name })

  return message('contacts.notices.name-cleared')
}

export async function addContact(client: QueryClient, contact: PostApiV1WorkspaceContactsBody) {
  const { data } = await postApiV1WorkspaceContacts(contact)
  await client.invalidateQueries({ queryKey: contactsKey })

  return data
}

export function updateContact(client: QueryClient, contact: ContactObject, change: ContactChange) {
  return optimistic<ContactsPage>(
    client,
    contactsKey,
    (page, key) => withContactChange(page, key, contact.id, change),
    () => patchApiV1WorkspaceContactsContactId(String(contact.id), change)
  )
}

export function removeContact(client: QueryClient, contact: ContactObject) {
  return optimistic<ContactsPage>(
    client,
    contactsKey,
    (page) => withoutContact(page, contact.id),
    () => deleteApiV1WorkspaceContactsContactId(String(contact.id))
  )
}
