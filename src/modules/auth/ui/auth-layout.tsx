import { Outlet } from '@tanstack/react-router'
import { Logo } from '@/ui/components/logo'

export function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="grid w-full max-w-sm gap-6">
        <Logo className="justify-self-center" />
        <Outlet />
      </div>
    </main>
  )
}
