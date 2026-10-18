import type { Query } from '@tanstack/query-core'
import { getApiV1LookupsLookupId } from '@/core/api/endpoints/lookups/lookups'
import { getApiV1WorkspaceLookups } from '@/core/api/endpoints/workspace-lookups/workspace-lookups'
import type { GetApiV1WorkspaceLookups200Metadata } from '@/core/api/models'
import { type Search, type SearcherType, toSearch } from '@/modules/core/searches/search'

export const RUNNING_REFRESH = 15_000

export const SEARCHES_PER_PAGE = 20

export type SearchListParams = {
  page: number
  perPage: number
  searcherType?: SearcherType
  searcherId?: number
}

export type SearchesPage = { searches: Search[]; metadata: GetApiV1WorkspaceLookups200Metadata }

export const searchKeys = {
  all: ['searches'] as const,
  lists: ['searches', 'list'] as const,
  list: (params: SearchListParams) => ['searches', 'list', params] as const,
  details: ['searches', 'detail'] as const,
  detail: (id: number) => ['searches', 'detail', id] as const,
  members: ['searches', 'members'] as const,
}

type Polled<T> = { state: { data?: T } }

// Polling covers a lost live stream while something runs
function refreshWhileRunning(searches: Search[]) {
  return searches.some((search) => search.status === 'running') ? RUNNING_REFRESH : false
}

function sameSearcher(a: SearchListParams, b: SearchListParams) {
  return a.searcherType === b.searcherType && a.searcherId === b.searcherId
}

export function searchesQuery(params: SearchListParams) {
  return {
    queryKey: searchKeys.list(params),
    // The OpenAPI omits the filters, axios sends them
    queryFn: async (): Promise<SearchesPage> => {
      const page = await getApiV1WorkspaceLookups({ params })

      return { searches: page.data.map(toSearch), metadata: page.metadata }
    },
    // Keep the previous page only for the same searcher
    placeholderData: (previous: SearchesPage | undefined, query?: Query<SearchesPage>) => {
      const before = query?.queryKey[2] as SearchListParams | undefined

      return before && sameSearcher(before, params) ? previous : undefined
    },
    refetchInterval: ({ state }: Polled<SearchesPage>) =>
      refreshWhileRunning(state.data?.searches ?? []),
  }
}

export function searchQuery(id: number) {
  return {
    queryKey: searchKeys.detail(id),
    queryFn: async () => toSearch((await getApiV1LookupsLookupId(String(id))).data),
    // The page shows its own error
    meta: { silent: true },
    refetchInterval: ({ state }: Polled<Search>) =>
      refreshWhileRunning(state.data ? [state.data] : []),
  }
}
