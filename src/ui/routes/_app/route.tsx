import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { requireSession, type Session, sessionQuery } from '@/modules/core/auth/session.query'
import { loadAccount } from '@/modules/core/workspace/account'
import { canOpen, pageAt } from '@/modules/core/workspace/navigation'
import { findMe, needsSetup } from '@/modules/core/workspace/workspace'
import { workspaceQuery } from '@/modules/core/workspace/workspace.query'
import { AccessDenied } from '@/modules/ui/app/access-denied'
import { AppHeader } from '@/modules/ui/app/app-header'
import { AppSidebar } from '@/modules/ui/app/app-sidebar'
import { ErrorScreen } from '@/modules/ui/app/status-screen'
import { AccountContext, useMe } from '@/modules/ui/app/use-me'
import { SidebarInset, SidebarProvider } from '@/ui/components/ui/sidebar'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const { session, redirect: login } = await requireSession(context.queryClient, location.href)
    if (login) throw redirect(login)

    const { workspace, me } = await loadAccount(context.queryClient, session.user.id)
    if (needsSetup(workspace, me)) throw redirect({ to: '/setup' })

    return { me }
  },
  errorComponent: ErrorScreen,
  component: AppLayout,
})

function AppLayout() {
  const { data: session } = useSuspenseQuery(sessionQuery)

  return session ? <SignedIn session={session} /> : <LoginRedirect />
}

function LoginRedirect() {
  const next = useLocation({ select: (location) => location.href })

  return <Navigate to="/login" search={{ next }} replace />
}

function SignedIn({ session }: { session: NonNullable<Session> }) {
  const { data: workspace } = useSuspenseQuery(workspaceQuery)
  const account = useMemo(() => {
    const me = findMe(workspace, session.user.id)

    return me && { session, workspace, me }
  }, [session, workspace])

  useEffect(() => {
    if (!account) window.location.reload()
  }, [account])

  return (
    account && (
      <AccountContext value={account}>
        <AppShell />
      </AccountContext>
    )
  )
}

function AppShell() {
  const { me } = useMe()
  const allowed = useLocation({
    select: (location) => canOpen(pageAt(location.pathname), me.permissions),
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="mx-auto grid w-full max-w-5xl gap-6">
            {allowed ? <Outlet /> : <AccessDenied />}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
