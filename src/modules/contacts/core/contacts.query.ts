import { keepPreviousData } from '@tanstack/query-core'
import {
  getGetApiV1WorkspaceContactsQueryKey,
  getGetApiV1WorkspaceContactsQueryOptions,
} from '@/core/api/endpoints/contacts/contacts'
import type {
  GetApiV1WorkspaceContacts200,
  GetApiV1WorkspaceContactsParams,
} from '@/core/api/models'
import type { ContactsSearch } from '@/modules/contacts/core/contacts'

export type ContactsPage = GetApiV1WorkspaceContacts200

export const contactsKey = getGetApiV1WorkspaceContactsQueryKey()

export function contactListParams({
  status,
  page,
  search,
}: ContactsSearch): GetApiV1WorkspaceContactsParams {
  return { page, status: status && [status], search }
}

export function listParamsOf(key: readonly unknown[]) {
  return key[1] as GetApiV1WorkspaceContactsParams | undefined
}

export function contactsQuery(params: GetApiV1WorkspaceContactsParams) {
  return getGetApiV1WorkspaceContactsQueryOptions(params, {
    query: { placeholderData: keepPreviousData, meta: { silent: true } },
  })
}
