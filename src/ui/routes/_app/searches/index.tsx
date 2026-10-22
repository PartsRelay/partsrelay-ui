import { createFileRoute } from '@tanstack/react-router'
import { searchListSchema } from '@/modules/searches/core/search'
import { SearchesPage } from '@/modules/searches/ui/searches-page'
export const Route = createFileRoute('/_app/searches/')({
  validateSearch: searchListSchema,
  staticData: { crumb: 'searches' },
  component: SearchesPage,
})
