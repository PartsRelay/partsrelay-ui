import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useLocation } from '@tanstack/react-router'
import { invitationView } from '@/modules/auth/core/invitation'
import {
  acceptInvitationMutation,
  currentCompanyQuery,
  invitationQuery,
} from '@/modules/auth/core/invitation.query'
import { loginError, signInErrorSearchSchema } from '@/modules/auth/core/sign-in'
import { InvitationScreen } from '@/modules/auth/ui/invitation-screen'
import { useSession } from '@/modules/auth/ui/use-session'

export const Route = createFileRoute('/(auth)/invitations/$invitationId')({
  validateSearch: signInErrorSearchSchema,
  component: InvitationPage,
})

function InvitationPage() {
  const { invitationId } = Route.useParams()
  const { error: signInError } = Route.useSearch()
  const next = useLocation({ select: (location) => location.href })
  const session = useSession()
  const signedIn = Boolean(session.email)
  const invitation = useQuery({ ...invitationQuery(invitationId), enabled: signedIn })
  const company = useQuery({ ...currentCompanyQuery, enabled: signedIn })
  const view = invitationView({
    invitation: invitation.data,
    error: invitation.error,
    loading: session.isPending || invitation.isLoading,
    signedIn,
    company,
  })

  return (
    <InvitationScreen
      view={view}
      session={session}
      next={next}
      signInError={loginError(signInError)}
      accept={(workspace) => acceptInvitationMutation(invitationId, workspace)}
    />
  )
}
