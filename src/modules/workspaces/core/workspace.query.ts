import {
  getGetFullOrganizationQueryOptions,
  getGetFullOrganizationSuspenseQueryOptions,
} from '@/core/api/auth/endpoints/organization/organization'
import { toWorkspace } from '@/modules/workspaces/core/workspace'

// The cache keeps the organization, select maps it to the model
export const workspaceKey = getGetFullOrganizationQueryOptions().queryKey

export const workspaceQuery = getGetFullOrganizationQueryOptions({ query: { select: toWorkspace } })

export const workspaceSuspenseQuery = getGetFullOrganizationSuspenseQueryOptions({
  query: { select: toWorkspace },
})
