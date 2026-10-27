import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { lookupsSearchSchema } from '@/modules/lookups/core/lookups'
import { LookupsPage } from '@/modules/lookups/ui/lookups-page'

export const Route = createFileRoute('/_app/(lookups)/lookups/')({
  validateSearch: lookupsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  staticData: { crumb: 'lookups' },
  head: pageHead('lookups.title'),
  component: LookupsPage,
})
