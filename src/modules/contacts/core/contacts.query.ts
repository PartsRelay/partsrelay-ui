import type { QueryFunctionContext } from '@tanstack/query-core'
import { getApiV1WorkspaceContacts } from '@/core/api/endpoints/contacts/contacts'
import type { ContactsSearch } from '@/modules/contacts/core/contacts'

export const CONTACTS_PER_PAGE = 20
export const contactsKey = (workspaceId: string) => ['workspaces', workspaceId, 'contacts'] as const

export function contactsQuery(workspaceId: string, search: ContactsSearch) {
  const params = {
    page: search.page,
    perPage: CONTACTS_PER_PAGE,
    ...(search.status ? { status: [search.status] } : {}),
  }
  return {
    queryKey: [...contactsKey(workspaceId), params] as const,
    queryFn: ({ signal }: QueryFunctionContext) => getApiV1WorkspaceContacts({ params }, signal),
    meta: { silent: true },
  }
}
