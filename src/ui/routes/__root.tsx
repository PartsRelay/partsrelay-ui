import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ErrorScreen, NotFoundScreen } from '@/modules/ui/app/status-screen'
import { Devtools } from '@/ui/components/devtools'
import { Toaster } from '@/ui/components/ui/sonner'
import { TooltipProvider } from '@/ui/components/ui/tooltip'

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
