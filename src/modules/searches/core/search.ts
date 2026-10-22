import { z } from 'zod'
import type { LookupObject } from '@/core/api/models'

export const searchFormSchema = z.object({
  plate: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase().replace(/[\s.-]/g, ''))
    .pipe(z.string().regex(/^[A-Z0-9]{4,8}$/)),
  query: z.string().trim().min(2).max(200),
})
export const searchListSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  requester: z.enum(['all', 'user', 'contact']).catch('all'),
  person: z.coerce.number().int().positive().optional().catch(undefined),
  newSearch: z.boolean().optional().catch(undefined),
})
export type SearchList = z.infer<typeof searchListSchema>
export type Search = LookupObject
export type SearchState = Exclude<Search['status'], 'done'> | 'results' | 'unavailable'
export function searchState(search: Search): SearchState {
  if (search.status !== 'done') return search.status
  return search.categories?.some((category) =>
    category.units.some((unit) => unit.original.length > 0)
  )
    ? 'results'
    : 'unavailable'
}
export function searchParams(filters: SearchList) {
  return {
    page: filters.page,
    perPage: 20,
    ...(filters.requester !== 'all'
      ? {
          searcherType: filters.requester,
          ...(filters.person ? { searcherId: filters.person } : {}),
        }
      : {}),
  }
}
export function visibleSearches(searches: Search[], text: string, status: string) {
  const term = text.trim().toLocaleLowerCase()
  return searches.filter(
    (search) =>
      (status === 'all' || search.status === status) &&
      (!term ||
        [search.plate, search.vin, search.vehicleDescription, search.searcher?.name].some((value) =>
          value?.toLocaleLowerCase().includes(term)
        ))
  )
}
export function requesterName(
  search: Search,
  members: { userId: string; name: string; email: string }[],
  fallback: string
) {
  if (!search.searcher) return fallback
  return (
    search.searcher.name ||
    members.find(
      (member) => member.userId === String(search.searcher?.id) && search.searcher?.type === 'user'
    )?.name ||
    fallback
  )
}
