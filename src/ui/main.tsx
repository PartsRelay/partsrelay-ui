import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/core/config/env'
import { bootstrapCore } from '@/modules/core/bootstrap'
import { watchAccount } from '@/modules/core/workspace/account'
import { followCompanyLanguage } from '@/ui/providers/i18n'
import { queryClient } from '@/ui/providers/query-client'
import { router } from '@/ui/router'
import '@/ui/styles/index.css'

if (import.meta.env.DEV && env.VITE_API_MOCKS !== 'false') {
  const { worker } = await import('@/ui/mocks/browser')
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
