import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ErrorScreen, NotFoundScreen } from '@/modules/workspaces/ui/status-screen'
import { Devtools } from '@/ui/components/devtools'
import { Toaster } from '@/ui/components/sonner'
import { TooltipProvider } from '@/ui/components/tooltip'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <Outlet />
      <Toaster />
      <Devtools />
    </TooltipProvider>
  )
}
