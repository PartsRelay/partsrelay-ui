import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { CompanyLanguage } from '@/modules/workspaces/ui/company-language'
import { CompanyName } from '@/modules/workspaces/ui/company-name'
import { DeleteCompany } from '@/modules/workspaces/ui/delete-company'
import { PageHeader } from '@/ui/components/page-header'

export const Route = createFileRoute('/_app/(workspaces)/company')({
  staticData: { crumb: 'company' },
  component: CompanyPage,
})

function CompanyPage() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <>
      <PageHeader title={t('company.title')} description={t('company.description')} />
      <CompanyName name={workspace.name} />
      <CompanyLanguage locale={workspace.locale} />
      <DeleteCompany workspace={workspace} />
    </>
  )
}
