import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useLocation } from '@tanstack/react-router'
import { invitationView } from '@/modules/auth/core/invitation'
import { currentCompanyQuery, invitationQuery } from '@/modules/auth/core/invitation.query'
import { loginError } from '@/modules/auth/core/sign-in'
import { InvitationScreen } from '@/modules/auth/ui/invitation-screen'
import { useSession } from '@/modules/auth/ui/use-session'

const route = getRouteApi('/(auth)/invitations/$invitationId')

export function InvitationPage() {
  const { invitationId } = route.useParams()
  const { error: signInError } = route.useSearch()
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
      invitationId={invitationId}
    />
  )
}
