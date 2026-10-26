import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { requireSetupOwner, SetupPage } from '@/modules/workspaces/ui/setup-page'

export const Route = createFileRoute('/(workspaces)/setup')({
  beforeLoad: requireSetupOwner,
  head: pageHead('setup.title'),
  component: SetupPage,
})
