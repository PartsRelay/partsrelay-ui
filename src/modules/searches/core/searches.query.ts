import { getApiV1LookupsLookupId, postApiV1Lookups } from '@/core/api/endpoints/lookups/lookups'
import { getApiV1WorkspaceLookups } from '@/core/api/endpoints/workspace-lookups/workspace-lookups'
import {
  searchParams,
  type SearchList,
  type Search,
  searchFormSchema,
} from '@/modules/searches/core/search'

export const searchKeys = {
  all: (workspaceId: string) => ['workspaces', workspaceId, 'searches'] as const,
  list: (workspaceId: string, filters: SearchList) =>
    [...searchKeys.all(workspaceId), 'list', searchParams(filters)] as const,
  detail: (workspaceId: string, id: number) =>
    [...searchKeys.all(workspaceId), 'detail', id] as const,
}
export function searchesQuery(workspaceId: string, filters: SearchList) {
  return {
    queryKey: searchKeys.list(workspaceId, filters),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      getApiV1WorkspaceLookups({ params: searchParams(filters), signal }),
    refetchInterval: 15_000,
    meta: { silent: true },
  }
}
export function searchQuery(workspaceId: string, id: number) {
  return {
    queryKey: searchKeys.detail(workspaceId, id),
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<Search> =>
      (await getApiV1LookupsLookupId(String(id), { signal })).data,
    refetchInterval: (query: { state: { data?: Search } }) =>
      query.state.data?.status === 'running' ? 5_000 : false,
    meta: { silent: true },
  }
}
export async function startSearch(values: unknown) {
  const body = searchFormSchema.parse(values)
  return (await postApiV1Lookups(body)).data
}
