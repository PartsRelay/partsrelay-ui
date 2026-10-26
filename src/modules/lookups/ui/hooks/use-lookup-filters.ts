import { getRouteApi } from '@tanstack/react-router'
import type { LookupFilters } from '@/modules/lookups/core/lookups'

const route = getRouteApi('/_app/(lookups)/searches/')

export function useLookupFilters() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const change = (filters: LookupFilters) =>
    void navigate({ search: (prev) => ({ ...prev, ...filters, page: undefined }) })

  return { search, change }
}
