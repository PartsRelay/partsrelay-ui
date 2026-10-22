import { createFileRoute, notFound } from '@tanstack/react-router'
import { SearchDetailPage } from '@/modules/searches/ui/search-detail'
export const Route = createFileRoute('/_app/searches/$searchId')({
  beforeLoad: ({ params }) => {
    if (!/^[1-9]\d*$/.test(params.searchId) || !Number.isSafeInteger(Number(params.searchId)))
      throw notFound()
  },
  staticData: { crumb: 'searches' },
  component: SearchDetailPage,
})
