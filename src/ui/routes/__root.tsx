import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Devtools } from '@/ui/components/devtools'
import { Toaster } from '@/ui/components/ui/sonner'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
      <Devtools />
    </>
  )
}
