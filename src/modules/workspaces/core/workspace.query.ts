import type { DataTag } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { type FullOrganization, toWorkspace } from '@/modules/workspaces/core/workspace'

// The cache keeps the organization, select maps it to the model
export const workspaceKey = ['workspace'] as DataTag<['workspace'], FullOrganization>

export class WorkspaceAccessError extends Error {
  readonly status = 403
  readonly error = { code: 'FORBIDDEN', status: 403 }

  constructor() {
    super('The current account no longer has access to this company')
  }
}

async function fetchOrganization(): Promise<FullOrganization> {
  const organization = await authClient.organization.getFullOrganization()
  // The core always keeps an active company on the session
  if (!organization) throw new WorkspaceAccessError()

  return organization
}

export const workspaceQuery = {
  queryKey: workspaceKey,
  queryFn: fetchOrganization,
  select: toWorkspace,
}
