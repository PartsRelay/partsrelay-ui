import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { profileView } from '@/modules/core/profile/profile'
import { useMe } from '@/modules/ui/app/use-me'
import { IdentityCard } from '@/modules/ui/profile/identity-card'
import { LeaveCompanyCard } from '@/modules/ui/profile/leave-company-card'
import { PageHeader } from '@/modules/ui/shared/page-header'

export const Route = createFileRoute('/_app/profile')({
  staticData: { crumb: 'profile' },
  component: ProfilePage,
})

function ProfilePage() {
  const { t } = useTranslation()
  const { session, workspace, me } = useMe()
  const view = profileView(me, workspace)

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      <IdentityCard view={view} userName={session.user.name} />
      <LeaveCompanyCard view={view} workspace={workspace} />
    </>
  )
}
