import type { QueryClient } from '@tanstack/query-core'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Navigate, redirect } from '@tanstack/react-router'
import { requireSession, sessionSuspenseQuery } from '@/modules/auth/core/session.query'
import { loadAccount } from '@/modules/workspaces/core/account'
import { SetupLayout } from '@/modules/workspaces/ui/setup-layout'
import { WorkspaceForm } from '@/modules/workspaces/ui/workspace-form'

const route = getRouteApi('/(workspaces)/setup')

type SetupGuard = { context: { queryClient: QueryClient }; location: { href: string } }

export async function requireSetupOwner({ context, location }: SetupGuard) {
  const { session, redirect: login } = await requireSession(context.queryClient, location.href)
  if (login) throw redirect(login)

  const { workspace, me } = await loadAccount(context.queryClient, session.user.id)
  if (!me.permissions.updateCompany) throw redirect({ to: '/' })

  return { session, workspace }
}

export function SetupPage() {
  const { session, workspace } = route.useRouteContext()
  const { data: current } = useSuspenseQuery(sessionSuspenseQuery)

  if (!current) return <Navigate to="/login" replace />

  return (
    <SetupLayout>
      <WorkspaceForm workspace={workspace} askName={session.user.name === ''} />
    </SetupLayout>
  )
}
