import { intlFormat } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { type InvitationDetails, invitationHeadline } from '@/modules/auth/core/invitation'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { CardDescription, CardHeader } from '@/ui/components/ui/card'

export function InvitationHeader({ details }: { details: InvitationDetails | null }) {
  const { t, i18n } = useTranslation()

  if (!details) {
    return (
      <CardHeader>
        <AuthTitle>{t('invitation.title')}</AuthTitle>
        <CardDescription>{t('invitation.sign-in.account')}</CardDescription>
      </CardHeader>
    )
  }

  return (
    <CardHeader>
      <AuthTitle>{t(...invitationHeadline(details))}</AuthTitle>
      <CardDescription className="grid gap-1">
        <span>{t(`invitation.join-as.${details.role}`, { role: t(...details.roleLabel) })}</span>
        <span>
          {t('invitation.expires', {
            date: intlFormat(details.expiresAt, { dateStyle: 'medium' }, { locale: i18n.language }),
          })}
        </span>
      </CardDescription>
    </CardHeader>
  )
}
