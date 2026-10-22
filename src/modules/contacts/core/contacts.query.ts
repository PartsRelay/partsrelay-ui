import type { Query, QueryFunctionContext } from '@tanstack/query-core'
import {
  getApiV1WorkspaceContacts,
  getGetApiV1WorkspaceContactsQueryKey,
} from '@/core/api/endpoints/contacts/contacts'
import type { ContactStatus, GetApiV1WorkspaceContacts200 } from '@/core/api/models'
import { type PaginationParams, withPerPage } from '@/core/pagination'
import type { ContactsSearch } from '@/modules/contacts/core/contacts'

export type ContactListParams = PaginationParams & { status?: ContactStatus[] }

export type ContactsPage = GetApiV1WorkspaceContacts200

// Every list, whatever its filters
export const contactsKey = getGetApiV1WorkspaceContactsQueryKey()

// Orval leaves the filters out, the list key adds them
export function contactsListKey(params: ContactListParams) {
  return [...contactsKey, params] as const
}

export function contactListParams({ status, page }: ContactsSearch): ContactListParams {
  return status ? { status: [status], page } : { page }
}

export function listParamsOf(key: readonly unknown[]) {
  return key[1] as ContactListParams | undefined
}

function sameStatus(a: ContactListParams, b: ContactListParams) {
  return String(a.status ?? '') === String(b.status ?? '')
}

export function contactsQuery(params: ContactListParams) {
  return {
    queryKey: contactsListKey(params),
    // The OpenAPI omits the filters, axios sends them as status[]
    queryFn: ({ signal }: QueryFunctionContext) =>
      getApiV1WorkspaceContacts({ params: withPerPage(params) }, signal),
    // Keep the previous page only within the same tab
    placeholderData: (previous?: ContactsPage, query?: Query<ContactsPage>) => {
      const before = query && listParamsOf(query.queryKey)

      return before && sameStatus(before, params) ? previous : undefined
    },
    // The directory shows load and refresh errors inline
    meta: { silent: true },
  }
}
