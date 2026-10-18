import { createFileRoute } from '@tanstack/react-router'
import { teamSearchSchema } from '@/modules/workspaces/core/team'
import { TeamPage } from '@/modules/workspaces/ui/team-page'

export const Route = createFileRoute('/_app/(workspaces)/team')({
  validateSearch: teamSearchSchema,
  staticData: { crumb: 'team' },
  component: TeamPage,
})
