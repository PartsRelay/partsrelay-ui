import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'
import { requireSession, sessionQuery } from '@/modules/auth/core/session.query'
import { loadAccount } from '@/modules/workspaces/core/account'
import { SetupLayout } from '@/modules/workspaces/ui/setup-layout'
import { WorkspaceForm } from '@/modules/workspaces/ui/workspace-form'

export const Route = createFileRoute('/(workspaces)/setup')({
  beforeLoad: async ({ context, location }) => {
    const { session, redirect: login } = await requireSession(context.queryClient, location.href)
    if (login) throw redirect(login)

    const { workspace, me } = await loadAccount(context.queryClient, session.user.id)
    if (!me.permissions.updateCompany) throw redirect({ to: '/' })

    return { session, workspace }
  },
  component: SetupPage,
})

function SetupPage() {
  const { session, workspace } = Route.useRouteContext()
  const { data: current } = useSuspenseQuery(sessionQuery)

  if (!current) return <Navigate to="/login" replace />

  return (
    <SetupLayout>
      <WorkspaceForm workspace={workspace} askName={session.user.name === ''} />
    </SetupLayout>
  )
}
