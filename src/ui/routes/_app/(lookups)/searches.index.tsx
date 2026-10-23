import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { lookupsSearchSchema } from '@/modules/lookups/core/lookups'
import { LookupsPage } from '@/modules/lookups/ui/lookups-page'

export const Route = createFileRoute('/_app/(lookups)/searches/')({
  validateSearch: lookupsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  staticData: { crumb: 'searches' },
  head: pageHead('lookups.title'),
  component: LookupsPage,
})
