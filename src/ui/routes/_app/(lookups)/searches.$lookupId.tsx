import { createFileRoute, notFound } from '@tanstack/react-router'
import { lookupIdSchema } from '@/modules/lookups/core/lookups'
import { LookupPage } from '@/modules/lookups/ui/lookup-page'

export const Route = createFileRoute('/_app/(lookups)/searches/$lookupId')({
  beforeLoad: ({ params }) => {
    if (!lookupIdSchema.safeParse(params.lookupId).success) throw notFound()
  },
  staticData: { crumb: 'search' },
  component: LookupPage,
})
