import { createRouter } from '@tanstack/react-router'
import type { Page } from '@/modules/workspaces/core/navigation'
import { routeTree } from '@/ui/routeTree.gen'
import { queryClient } from '@/query-client'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  notFoundMode: 'root',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface StaticDataRouteOption {
    crumb?: Page
  }
}
