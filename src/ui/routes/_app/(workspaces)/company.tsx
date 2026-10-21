import { createFileRoute } from '@tanstack/react-router'
import { CompanyPage } from '@/modules/workspaces/ui/company-page'

export const Route = createFileRoute('/_app/(workspaces)/company')({
  staticData: { crumb: 'company' },
  component: CompanyPage,
})
