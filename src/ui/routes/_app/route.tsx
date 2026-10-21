import { createFileRoute } from '@tanstack/react-router'
import { AppLayout, requireAccount } from '@/modules/workspaces/ui/app-layout'
import { ErrorScreen } from '@/modules/workspaces/ui/status-screen'

export const Route = createFileRoute('/_app')({
  beforeLoad: requireAccount,
  errorComponent: ErrorScreen,
  component: AppLayout,
})
