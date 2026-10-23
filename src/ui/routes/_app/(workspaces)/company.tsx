import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { CompanyPage } from '@/modules/workspaces/ui/company-page'

export const Route = createFileRoute('/_app/(workspaces)/company')({
  staticData: { crumb: 'company' },
  head: pageHead('company.title'),
  component: CompanyPage,
})
