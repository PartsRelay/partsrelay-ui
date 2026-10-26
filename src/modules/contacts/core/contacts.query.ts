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

export const contactsKey = getGetApiV1WorkspaceContactsQueryKey()

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
    queryFn: ({ signal }: QueryFunctionContext) =>
      getApiV1WorkspaceContacts({ params: withPerPage(params) }, signal),
    placeholderData: (previous?: ContactsPage, query?: Query<ContactsPage>) => {
      const before = query && listParamsOf(query.queryKey)

      return before && sameStatus(before, params) ? previous : undefined
    },
    meta: { silent: true },
  }
}
