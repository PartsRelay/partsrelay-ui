import { useTranslation } from 'react-i18next'
import { CompanyLanguage } from '@/modules/workspaces/ui/company-language'
import { CompanyName } from '@/modules/workspaces/ui/company-name'
import { DeleteCompany } from '@/modules/workspaces/ui/delete-company'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PageHeader } from '@/ui/components/page-header'

export function CompanyPage() {
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
