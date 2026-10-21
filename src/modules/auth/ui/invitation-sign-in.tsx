import { useTranslation } from 'react-i18next'
import { invitationFlow } from '@/modules/auth/core/sign-in'
import type { Message } from '@/core/message'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import { SignInOptions } from '@/modules/auth/ui/sign-in-options'
import { Callout } from '@/ui/components/callout'
import { Card, CardContent } from '@/ui/components/ui/card'

type InvitationSignInProps = { next: string; error: Message | null }

export function InvitationSignIn({ next, error }: InvitationSignInProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <InvitationHeader />
      <CardContent className="grid gap-6">
        {error && <Callout tone="danger">{t(...error)}</Callout>}
        <SignInOptions flow={invitationFlow(next)} />
      </CardContent>
    </Card>
  )
}
