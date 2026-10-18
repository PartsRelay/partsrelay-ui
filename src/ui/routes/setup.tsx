import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireSession } from '@/modules/core/auth/session.query'
import { loadAccount } from '@/modules/core/workspace/account'
import { SetupLayout } from '@/modules/ui/setup/setup-layout'
import { WorkspaceForm } from '@/modules/ui/setup/workspace-form'

export const Route = createFileRoute('/setup')({
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

  return (
    <SetupLayout>
      <WorkspaceForm workspace={workspace} askName={session.user.name === ''} />
    </SetupLayout>
  )
}
