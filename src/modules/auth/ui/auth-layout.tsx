import { Outlet, useLocation } from '@tanstack/react-router'
import { env } from '@/env'
import '@/modules/auth/ui/login.css'

export function AuthLayout() {
  const path = useLocation({ select: (location) => location.pathname })
  if (path.replace(/\/+$/, '') === '/login') return <Outlet />

  return (
    <main className="simple-auth-layout">
      <img
        className="invitation-brand"
        src="/brand/logo-dark.png"
        alt={env.APP_NAME}
        width="196"
        height="48"
      />
      <Outlet />
    </main>
  )
}
