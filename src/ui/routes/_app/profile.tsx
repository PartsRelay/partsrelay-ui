import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/ui/shared/page-header'

export const Route = createFileRoute('/_app/profile')({
  staticData: { crumb: 'profile' },
  component: ProfilePage,
})

function ProfilePage() {
  const { t } = useTranslation()

  return <PageHeader title={t('profile.title')} description={t('profile.description')} />
}
