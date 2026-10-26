import type { QueryClient } from '@tanstack/query-core'
import { postApiV1Lookups } from '@/core/api/endpoints/lookups/lookups'
import type { PostApiV1LookupsBody } from '@/core/api/models'
import { refreshLookupLists } from '@/modules/lookups/core/lookups.query'

export async function startLookup(client: QueryClient, lookup: PostApiV1LookupsBody) {
  const { data } = await postApiV1Lookups(lookup)
  await refreshLookupLists(client)

  return data
}
