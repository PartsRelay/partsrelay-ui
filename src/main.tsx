import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/env'
import { bootstrapCore } from '@/core/bootstrap'
import { watchAccount } from '@/modules/workspaces/core/account'
import { followCompanyLanguage } from '@/i18n'
import { queryClient } from '@/query-client'
import { router } from '@/router'
import '@/index.css'

if (import.meta.env.DEV && env.VITE_API_MOCKS !== 'false') {
  const { worker } = await import('@/core/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

bootstrapCore()
watchAccount(queryClient, () => window.location.reload())
followCompanyLanguage(queryClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
