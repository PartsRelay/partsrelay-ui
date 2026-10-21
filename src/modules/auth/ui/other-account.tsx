import { LogOutIcon, UserRoundXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import type { SessionState } from '@/modules/auth/ui/hooks/use-session'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'
import { Callout } from '@/ui/components/callout'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent } from '@/ui/components/ui/card'
import { Spinner } from '@/ui/components/ui/spinner'

type OtherAccountProps = { session: SessionState }

export function OtherAccount({ session }: OtherAccountProps) {
  const { t } = useTranslation()
  const { pending, signOut } = useSignOut()

  return (
    <Card>
      <InvitationHeader />
      <CardContent className="grid gap-6">
        <Callout
          tone="danger"
          icon={UserRoundXIcon}
          title={t('invitation.unavailable.other-email')}
          className="wrap-anywhere"
        >
          {t('invitation.other-account.switch', { email: session.email })}
        </Callout>
        <Button variant="outline" disabled={pending} onClick={() => void signOut()}>
          {pending ? <Spinner data-icon="inline-start" /> : <LogOutIcon data-icon="inline-start" />}
          {t('invitation.actions.sign-out')}
        </Button>
      </CardContent>
    </Card>
  )
}
