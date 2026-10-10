import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/ui/routeTree.gen'
import { queryClient } from '@/ui/providers/query-client'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
