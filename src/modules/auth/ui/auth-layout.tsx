import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </main>
  )
}
