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
import { useTranslation } from 'react-i18next'
import { PreviewNotice } from '@/ui/components/preview-notice'
import { useSearchStream } from '@/modules/searches/ui/hooks/use-search-stream'
import { useSearchLanguage } from '@/modules/searches/ui/hooks/use-search-language'

type AppGuard = { context: { queryClient: QueryClient }; location: { href: string } }

export async function requireAccount({ context, location }: AppGuard) {
  const { session, redirect: login } = await requireSession(context.queryClient, location.href)
  if (login) throw redirect(login)

  const { workspace, me } = await loadAccount(context.queryClient, session.user.id)
  if (needsSetup(workspace, me)) throw redirect({ to: '/setup' })

  return { me }
}

export function redirectHome({ context }: { context: { me: Me } }) {
  throw redirect({ to: homePath(context.me.permissions), search: { page: 1, requester: 'all' } })
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
  const { me, workspace } = useMe()
  const { t } = useTranslation()
  useSearchStream(workspace.id)
  useSearchLanguage(workspace.id)
  const allowed = useLocation({
    select: (location) => canOpen(pageAt(location.pathname), me.permissions),
  })

  return (
    <div className="workspace-app">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline focus:outline-2 focus:outline-primary"
      >
        {t('design.skip-to-content')}
      </a>
      <AppSidebar />
      <div className="workspace-surface">
        <AppHeader />
        <main className="workspace-content" id="main-content" tabIndex={-1}>
          <PreviewNotice />
          <div>{allowed ? <Outlet /> : <AccessDenied />}</div>
        </main>
        <footer className="workspace-footer">
          <span>
            {workspace.name} · {t('design.shared-workspace')}
          </span>
          <span>{t('design.footer')}</span>
        </footer>
      </div>
    </div>
  )
}
