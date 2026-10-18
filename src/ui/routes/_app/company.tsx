import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/ui/shared/page-header'

export const Route = createFileRoute('/_app/company')({
  staticData: { crumb: 'company' },
  component: CompanyPage,
})

function CompanyPage() {
  const { t } = useTranslation()

  return <PageHeader title={t('company.title')} description={t('company.description')} />
}
