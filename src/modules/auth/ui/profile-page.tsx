import { useTranslation } from 'react-i18next'
import { profileView } from '@/modules/auth/core/profile'
import { IdentityCard } from '@/modules/auth/ui/identity-card'
import { LeaveCompanyCard } from '@/modules/auth/ui/leave-company-card'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { PageHeader } from '@/ui/components/page-header'

export function ProfilePage() {
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
