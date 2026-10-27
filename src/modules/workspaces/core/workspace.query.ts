import type { DataTag } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { type FullOrganization, toWorkspace } from '@/modules/workspaces/core/workspace'

export const workspaceKey = ['workspace'] as DataTag<['workspace'], FullOrganization>

async function fetchOrganization(): Promise<FullOrganization> {
  const organization = await authClient.organization.getFullOrganization()
  if (!organization) throw new Error('No active company')

  return organization
}

export const workspaceQuery = {
  queryKey: workspaceKey,
  queryFn: fetchOrganization,
  select: toWorkspace,
}
