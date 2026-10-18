import type { MutationOptions, QueryKey } from '@tanstack/query-core'
import {
  deleteApiV1WorkspaceContactsContactId,
  patchApiV1WorkspaceContactsContactId,
  postApiV1WorkspaceContacts,
} from '@/core/api/endpoints/contacts/contacts'
import type {
  ContactObject,
  PatchApiV1WorkspaceContactsContactIdBody,
  PostApiV1WorkspaceContacts201,
} from '@/core/api/models'
import type { NewContact } from '@/modules/core/contacts/contact-form'
import { contactName } from '@/modules/core/contacts/contacts'
import {
  type ContactListParams,
  type ContactsPage,
  contactKeys,
} from '@/modules/core/contacts/contacts.query'
import { message } from '@/modules/core/shared/message'
import { optimistic, type Snapshot } from '@/modules/core/shared/optimistic'

type ContactPatch = PatchApiV1WorkspaceContactsContactIdBody

type ListMutation<TVariables> = MutationOptions<unknown, Error, TVariables, Snapshot<ContactsPage>>

function removeFromList(page: ContactsPage, id: number): ContactsPage {
  if (!page.data.some((item) => item.id === id)) return page

  return {
    data: page.data.filter((item) => item.id !== id),
    metadata: { ...page.metadata, total: Math.max(0, page.metadata.total - 1) },
  }
}

// Drop the contact from lists filtering out its status
function patchInList(page: ContactsPage, key: QueryKey, id: number, patch: ContactPatch) {
  const { status } = key[2] as ContactListParams
  const contact = page.data.find((item) => item.id === id)
  if (!contact) return page

  const updated: ContactObject = { ...contact, ...patch }
  if (status && !status.includes(updated.status)) return removeFromList(page, id)

  return { ...page, data: page.data.map((item) => (item.id === id ? updated : item)) }
}

function updateContact(contact: ContactObject, patch: ContactPatch) {
  return {
    mutationFn: () => patchApiV1WorkspaceContactsContactId(String(contact.id), patch),
    ...optimistic<ContactsPage, void>(contactKeys.lists, (page, _variables, key) =>
      patchInList(page, key, contact.id, patch)
    ),
  }
}

export const createContactMutation = {
  mutationKey: ['contacts', 'create'],
  mutationFn: (contact: NewContact) => postApiV1WorkspaceContacts(contact),
  onSuccess: (_data, _contact, _result, { client }) =>
    client.invalidateQueries({ queryKey: contactKeys.lists }),
  // The form shows the errors next to the fields
  meta: {
    silent: true,
    notice: (_contact: NewContact, { data }: PostApiV1WorkspaceContacts201) =>
      message('contacts.notices.added', { name: contactName(data) }),
  },
} satisfies MutationOptions<PostApiV1WorkspaceContacts201, Error, NewContact>

export function renameContactMutation(contact: ContactObject) {
  return {
    mutationKey: ['contacts', 'rename', contact.id],
    mutationFn: (name: string | null) =>
      patchApiV1WorkspaceContactsContactId(String(contact.id), { name }),
    ...optimistic<ContactsPage, string | null>(contactKeys.lists, (page, name, key) =>
      patchInList(page, key, contact.id, { name })
    ),
    meta: {
      notice: (name: string | null) =>
        name
          ? message('contacts.notices.renamed', { name })
          : message('contacts.notices.nameCleared'),
    },
  } satisfies ListMutation<string | null>
}

export function blockContactMutation(contact: ContactObject) {
  return {
    mutationKey: ['contacts', 'block', contact.id],
    ...updateContact(contact, { status: 'blocked' }),
    meta: { notice: message('contacts.notices.blocked', { name: contactName(contact) }) },
  } satisfies ListMutation<void>
}

export function unblockContactMutation(contact: ContactObject) {
  return {
    mutationKey: ['contacts', 'unblock', contact.id],
    ...updateContact(contact, { status: 'active' }),
    meta: { notice: message('contacts.notices.unblocked', { name: contactName(contact) }) },
  } satisfies ListMutation<void>
}

export function removeContactMutation(contact: ContactObject) {
  return {
    mutationKey: ['contacts', 'remove', contact.id],
    mutationFn: () => deleteApiV1WorkspaceContactsContactId(String(contact.id)),
    ...optimistic<ContactsPage, void>(contactKeys.lists, (page) =>
      removeFromList(page, contact.id)
    ),
    meta: { notice: message('contacts.notices.removed', { name: contactName(contact) }) },
  } satisfies ListMutation<void>
}
