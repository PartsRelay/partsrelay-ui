import type { QueryClient } from '@tanstack/query-core'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Navigate, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { requireSession, type Session, sessionQuery } from '@/modules/auth/core/session.query'
import { loadAccount } from '@/modules/workspaces/core/account'
import { canOpen, homePath, pageAt } from '@/modules/workspaces/core/navigation'
import { findMe, type Me, needsSetup } from '@/modules/workspaces/core/workspace'
import { workspaceQuery } from '@/modules/workspaces/core/workspace.query'
import { AccessDenied } from '@/modules/workspaces/ui/access-denied'
import { AppHeader } from '@/modules/workspaces/ui/app-header'
import { AppSidebar } from '@/modules/workspaces/ui/app-sidebar'
import { AccountContext, useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { SidebarInset, SidebarProvider } from '@/ui/components/ui/sidebar'

type AppGuard = { context: { queryClient: QueryClient }; location: { href: string } }

export async function requireAccount({ context, location }: AppGuard) {
  const { session, redirect: login } = await requireSession(context.queryClient, location.href)
  if (login) throw redirect(login)

  const { workspace, me } = await loadAccount(context.queryClient, session.user.id)
  if (needsSetup(workspace, me)) throw redirect({ to: '/setup' })

  return { me }
}

export function redirectHome({ context }: { context: { me: Me } }) {
  throw redirect({ to: homePath(context.me.permissions) })
}

export function AppLayout() {
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
