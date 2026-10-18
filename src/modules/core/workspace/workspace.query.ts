import { authClient } from '@/modules/core/auth/auth.client'
import { toWorkspace } from '@/modules/core/workspace/workspace'

export const workspaceKeys = { all: ['workspace'] as const }

export const workspaceQuery = {
  queryKey: workspaceKeys.all,
  queryFn: async () => toWorkspace(await authClient.organization.getFullOrganization()),
}
