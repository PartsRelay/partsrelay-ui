import { createFileRoute } from '@tanstack/react-router'
import { requireSetupOwner, SetupPage } from '@/modules/workspaces/ui/setup-page'

export const Route = createFileRoute('/(workspaces)/setup')({
  beforeLoad: requireSetupOwner,
  component: SetupPage,
})
