import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { mocksEnabled } from '@/core/mocks/enabled'
import { watchAccount } from '@/modules/workspaces/core/account'
import '@/i18n'
import { queryClient } from '@/query-client'
import { router } from '@/router'

if (mocksEnabled) {
  const { worker } = await import('@/core/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

watchAccount(queryClient, () => window.location.reload())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
