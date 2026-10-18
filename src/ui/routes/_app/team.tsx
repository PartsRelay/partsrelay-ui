import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/ui/shared/page-header'

export const Route = createFileRoute('/_app/team')({
  staticData: { crumb: 'team' },
  component: TeamPage,
})

function TeamPage() {
  const { t } = useTranslation()

  return <PageHeader title={t('team.title')} description={t('team.description')} />
}
