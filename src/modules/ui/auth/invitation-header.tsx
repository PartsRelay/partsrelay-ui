import { useTranslation } from 'react-i18next'
import { type InvitationDetails, invitationHeadline } from '@/modules/core/auth/invitation'
import { formatDate } from '@/modules/core/shared/format'
import { AuthTitle } from '@/modules/ui/auth/auth-title'
import { useT } from '@/modules/ui/shared/use-t'
import { CardDescription, CardHeader } from '@/ui/components/ui/card'

export function InvitationHeader({ details }: { details: InvitationDetails | null }) {
  const { t, i18n } = useTranslation()
  const translate = useT()

  if (!details) {
    return (
      <CardHeader>
        <AuthTitle>{t('invitation.title')}</AuthTitle>
        <CardDescription>{t('invitation.signIn.account')}</CardDescription>
      </CardHeader>
    )
  }

  return (
    <CardHeader>
      <AuthTitle>{translate(invitationHeadline(details))}</AuthTitle>
      <CardDescription className="grid gap-1">
        <span>
          {t(`invitation.joinAs.${details.role}`, { role: translate(details.roleLabel) })}
        </span>
        <span>
          {t('invitation.expires', { date: formatDate(details.expiresAt, i18n.language) })}
        </span>
      </CardDescription>
    </CardHeader>
  )
}
