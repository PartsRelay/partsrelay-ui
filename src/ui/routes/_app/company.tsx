import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/modules/ui/app/use-me'
import { CompanyLanguage } from '@/modules/ui/company/company-language'
import { CompanyName } from '@/modules/ui/company/company-name'
import { DeleteCompany } from '@/modules/ui/company/delete-company'
import { PageHeader } from '@/modules/ui/shared/page-header'

export const Route = createFileRoute('/_app/company')({
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
