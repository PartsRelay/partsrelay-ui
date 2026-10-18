import { invitationFlow } from '@/modules/core/auth/sign-in'
import type { Message } from '@/modules/core/shared/message'
import { InvitationHeader } from '@/modules/ui/auth/invitation-header'
import { SignInOptions } from '@/modules/ui/auth/sign-in-options'
import { Callout } from '@/modules/ui/shared/callout'
import { useT } from '@/modules/ui/shared/use-t'
import { Card, CardContent } from '@/ui/components/ui/card'

type InvitationSignInProps = { next: string; error: Message | null }

export function InvitationSignIn({ next, error }: InvitationSignInProps) {
  const translate = useT()

  return (
    <Card>
      <InvitationHeader details={null} />
      <CardContent className="grid gap-6">
        {error && <Callout tone="danger">{translate(error)}</Callout>}
        <SignInOptions flow={invitationFlow(next)} />
      </CardContent>
    </Card>
  )
}
