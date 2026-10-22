import { useTranslation } from 'react-i18next'
import { CompanyLanguage } from '@/modules/workspaces/ui/company-language'
import { CompanyName } from '@/modules/workspaces/ui/company-name'
import { DeleteCompany } from '@/modules/workspaces/ui/delete-company'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PageHeader } from '@/ui/components/page-header'
import { Badge } from '@/ui/components/ui/badge'
import '@/modules/workspaces/ui/workspace-pages.css'

export function CompanyPage() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <div className="workspace-page company-page page-stack">
      <div className="workspace-page-heading">
        <p className="eyebrow">{t('company.eyebrow')}</p>
        <PageHeader
          title={t('company.title')}
          description={t('company.description')}
          badge={<Badge variant="secondary">{t('company.owner-access')}</Badge>}
        />
      </div>
      <CompanyName name={workspace.name} />
      <CompanyLanguage locale={workspace.locale} storedLocale={workspace.storedLocale} />
      <div className="company-danger">
        <DeleteCompany workspace={workspace} />
      </div>
    </div>
  )
}
