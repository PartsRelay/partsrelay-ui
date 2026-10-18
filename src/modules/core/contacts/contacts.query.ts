import type { Query } from '@tanstack/query-core'
import { getApiV1WorkspaceContacts } from '@/core/api/endpoints/contacts/contacts'
import type { GetApiV1WorkspaceContacts200 } from '@/core/api/models'
import type { ContactStatus, ContactsSearch } from '@/modules/core/contacts/contacts'

export const CONTACTS_PER_PAGE = 20

export type ContactListParams = { status?: ContactStatus[]; page: number; perPage: number }

export type ContactsPage = GetApiV1WorkspaceContacts200

export const contactKeys = {
  all: ['contacts'] as const,
  lists: ['contacts', 'list'] as const,
  list: (params: ContactListParams) => ['contacts', 'list', params] as const,
}

export function contactListParams({ status, page }: ContactsSearch): ContactListParams {
  const params = { page, perPage: CONTACTS_PER_PAGE }

  return status ? { status: [status], ...params } : params
}

function sameStatus(a: ContactListParams, b: ContactListParams) {
  return String(a.status ?? '') === String(b.status ?? '')
}

export function contactsQuery(params: ContactListParams) {
  return {
    queryKey: contactKeys.list(params),
    // The OpenAPI omits the filters, axios sends them as status[]
    queryFn: () => getApiV1WorkspaceContacts({ params }),
    // Keep the previous page only within the same tab
    placeholderData: (previous: ContactsPage | undefined, query?: Query<ContactsPage>) => {
      const before = query?.queryKey[2] as ContactListParams | undefined

      return before && sameStatus(before, params) ? previous : undefined
    },
  }
}
