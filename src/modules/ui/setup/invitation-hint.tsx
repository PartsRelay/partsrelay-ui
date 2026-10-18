import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MailIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { pendingInvitation } from '@/modules/core/setup/setup'
import { userInvitationsQuery } from '@/modules/core/setup/setup.query'
import { Callout } from '@/modules/ui/shared/callout'

export function InvitationHint() {
  const { t } = useTranslation()
  const { data } = useQuery(userInvitationsQuery)
  const invitation = pendingInvitation(data, new Date())

  if (!invitation) return null

  return (
    <Callout
      icon={MailIcon}
      title={t('setup.invitation.title', { company: invitation.organizationName })}
    >
      <p>{t('setup.invitation.description')}</p>
      <Link to="/invitations/$invitationId" params={{ invitationId: invitation.id }}>
        {t('setup.invitation.open')}
      </Link>
    </Callout>
  )
}
