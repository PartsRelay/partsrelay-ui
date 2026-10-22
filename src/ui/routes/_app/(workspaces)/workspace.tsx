import { createFileRoute } from '@tanstack/react-router'
import { workspaceSearchSchema } from '@/modules/workspaces/core/workspace'
import { WorkspacePage } from '@/modules/workspaces/ui/workspace-page'

export const Route = createFileRoute('/_app/(workspaces)/workspace')({
  validateSearch: workspaceSearchSchema,
  staticData: { crumb: 'team' },
  component: WorkspacePage,
})
