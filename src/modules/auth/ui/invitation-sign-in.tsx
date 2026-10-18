import { invitationFlow } from '@/modules/auth/core/sign-in'
import type { Message } from '@/core/message'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import { SignInOptions } from '@/modules/auth/ui/sign-in-options'
import { Callout } from '@/ui/components/callout'
import { useT } from '@/ui/components/use-t'
import { Card, CardContent } from '@/ui/components/card'

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
