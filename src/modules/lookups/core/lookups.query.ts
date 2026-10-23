import type { Query, QueryFunctionContext } from '@tanstack/query-core'
import {
  getApiV1LookupsLookupId,
  getGetApiV1LookupsLookupIdQueryKey,
} from '@/core/api/endpoints/lookups/lookups'
import {
  getApiV1WorkspaceLookups,
  getGetApiV1WorkspaceLookupsQueryKey,
} from '@/core/api/endpoints/workspace-lookups/workspace-lookups'
import type {
  GetApiV1LookupsLookupId200,
  GetApiV1WorkspaceLookups200,
  SearcherType,
} from '@/core/api/models'
import { type PaginationParams, withPerPage } from '@/core/pagination'

export type LookupListParams = PaginationParams & {
  searcherType?: SearcherType
  searcherId?: number
}

export type LookupsPage = GetApiV1WorkspaceLookups200

export type LookupResponse = GetApiV1LookupsLookupId200

// Every list, whatever its filters
export const lookupsKey = getGetApiV1WorkspaceLookupsQueryKey()

// Orval leaves the filters out, the list key adds them
export function lookupsListKey(params: LookupListParams) {
  return [...lookupsKey, params] as const
}

export function listParamsOf(key: readonly unknown[]) {
  return key[1] as LookupListParams | undefined
}

export function lookupKey(id: number) {
  return getGetApiV1LookupsLookupIdQueryKey(String(id))
}

function sameSearcher(a: LookupListParams, b: LookupListParams) {
  return a.searcherType === b.searcherType && a.searcherId === b.searcherId
}

function lookupOf({ data }: LookupResponse) {
  return data
}

export function lookupsQuery(params: LookupListParams) {
  return {
    queryKey: lookupsListKey(params),
    // The OpenAPI omits the filters, axios sends them
    queryFn: ({ signal }: QueryFunctionContext) =>
      getApiV1WorkspaceLookups({ params: withPerPage(params) }, signal),
    // Keep the previous page only for the same searcher
    placeholderData: (previous?: LookupsPage, query?: Query<LookupsPage>) => {
      const before = query && listParamsOf(query.queryKey)

      return before && sameSearcher(before, params) ? previous : undefined
    },
    meta: { silent: true },
  }
}

export function lookupQuery(id: number) {
  return {
    queryKey: lookupKey(id),
    queryFn: ({ signal }: QueryFunctionContext) =>
      getApiV1LookupsLookupId(String(id), undefined, signal),
    // The cache keeps the response, select unwraps the lookup
    select: lookupOf,
    // The page shows its own error
    meta: { silent: true },
  }
}
