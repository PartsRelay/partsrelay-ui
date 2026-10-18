import type { UseMutationOptions } from '@tanstack/react-query'
import type { InvitationView } from '@/modules/core/auth/invitation'
import type { Message } from '@/modules/core/shared/message'
import { InvitationFailed } from '@/modules/ui/auth/invitation-failed'
import { InvitationReady } from '@/modules/ui/auth/invitation-ready'
import { InvitationSignIn } from '@/modules/ui/auth/invitation-sign-in'
import { InvitationSkeleton } from '@/modules/ui/auth/invitation-skeleton'
import { InvitationUnavailable } from '@/modules/ui/auth/invitation-unavailable'
import { OtherAccount } from '@/modules/ui/auth/other-account'
import type { SessionState } from '@/modules/ui/auth/use-session'

type InvitationScreenProps = {
  view: InvitationView
  session: SessionState
  next: string
  signInError: Message | null
  accept: (workspace: string) => UseMutationOptions<unknown, Error, void>
}

export function InvitationScreen({
  view,
  session,
  next,
  signInError,
  accept,
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
          email={session.email}
          accept={accept(view.details.workspace)}
        />
      )
  }
}
