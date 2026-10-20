import type { InvitationView } from '@/modules/auth/core/invitation'
import type { Message } from '@/core/message'
import { InvitationFailed } from '@/modules/auth/ui/invitation-failed'
import { InvitationReady } from '@/modules/auth/ui/invitation-ready'
import { InvitationSignIn } from '@/modules/auth/ui/invitation-sign-in'
import { InvitationSkeleton } from '@/modules/auth/ui/invitation-skeleton'
import { InvitationUnavailable } from '@/modules/auth/ui/invitation-unavailable'
import { OtherAccount } from '@/modules/auth/ui/other-account'
import type { SessionState } from '@/modules/auth/ui/use-session'

type InvitationScreenProps = {
  view: InvitationView
  session: SessionState
  next: string
  signInError: Message | null
  invitationId: string
}

export function InvitationScreen({
  view,
  session,
  next,
  signInError,
  invitationId,
}: InvitationScreenProps) {
  switch (view.state) {
    case 'loading':
      return <InvitationSkeleton />
    case 'failed':
      return <InvitationFailed reason={view.reason} />
    case 'unavailable':
      return <InvitationUnavailable reason={view.reason} />
    case 'signIn':
      return <InvitationSignIn next={next} error={signInError} />
    case 'otherAccount':
      return <OtherAccount session={session} />
    case 'ready':
      return (
        <InvitationReady
          details={view.details}
          confirm={view.confirm}
          email={session.email}
          invitationId={invitationId}
        />
      )
  }
}
