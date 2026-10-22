import { createFileRoute } from '@tanstack/react-router'
import { LookupPage } from '@/modules/lookups/ui/lookup-page'

export const Route = createFileRoute('/_app/(lookups)/searches/$lookupId')({
  staticData: { crumb: 'search' },
  component: LookupPage,
})
