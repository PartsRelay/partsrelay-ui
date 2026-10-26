import { keepPreviousData, type QueryClient } from '@tanstack/query-core'
import {
  getGetApiV1LookupsLookupIdQueryKey,
  getGetApiV1LookupsLookupIdQueryOptions,
} from '@/core/api/endpoints/lookups/lookups'
import {
  getGetApiV1WorkspaceLookupsQueryKey,
  getGetApiV1WorkspaceLookupsQueryOptions,
  getGetApiV1WorkspaceLookupsStatsQueryKey,
  getGetApiV1WorkspaceLookupsStatsQueryOptions,
} from '@/core/api/endpoints/workspace-lookups/workspace-lookups'
import type { GetApiV1WorkspaceLookupsParams, LookupObject } from '@/core/api/models'

const STATS_DAYS = 30

const lookupsKey = getGetApiV1WorkspaceLookupsQueryKey()

const lookupStatsKey = getGetApiV1WorkspaceLookupsStatsQueryKey()

export function lookupKey(id: number) {
  return getGetApiV1LookupsLookupIdQueryKey(String(id))
}

export function refreshLookupLists(client: QueryClient) {
  return Promise.all(
    [lookupsKey, lookupStatsKey].map((queryKey) => client.invalidateQueries({ queryKey }))
  )
}

export function lookupsQuery(params: GetApiV1WorkspaceLookupsParams) {
  return getGetApiV1WorkspaceLookupsQueryOptions(params, {
    query: { placeholderData: keepPreviousData, meta: { silent: true } },
  })
}

export const lookupStatsQuery = getGetApiV1WorkspaceLookupsStatsQueryOptions(
  { days: STATS_DAYS },
  { query: { select: ({ data }) => data, meta: { silent: true } } }
)

export function lookupQuery(id: number) {
  return getGetApiV1LookupsLookupIdQueryOptions<LookupObject>(String(id), {
    query: { select: ({ data }) => data, meta: { silent: true } },
  })
}
