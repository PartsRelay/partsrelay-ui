import { createFileRoute, notFound } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { lookupIdSchema } from '@/modules/lookups/core/lookups'
import { LookupPage } from '@/modules/lookups/ui/lookup-page'

export const Route = createFileRoute('/_app/(lookups)/lookups/$lookupId')({
  beforeLoad: ({ params }) => {
    if (!lookupIdSchema.safeParse(params.lookupId).success) throw notFound()
  },
  staticData: { crumb: 'lookup' },
  head: pageHead('lookups.detail.title'),
  component: LookupPage,
})
