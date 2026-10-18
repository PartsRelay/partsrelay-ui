import { authClient } from '@/modules/auth/core/auth.client'
import { toWorkspace } from '@/modules/workspaces/core/workspace'

export const workspaceKeys = { all: ['workspace'] as const }

export const workspaceQuery = {
  queryKey: workspaceKeys.all,
  queryFn: async () => toWorkspace(await authClient.organization.getFullOrganization()),
}
