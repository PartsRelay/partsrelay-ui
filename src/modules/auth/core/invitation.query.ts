import type { Query, QueryFilters } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { workspaceKey, workspaceQuery } from '@/modules/workspaces/core/workspace.query'

export const failedQueries = {
  type: 'active',
  predicate: (query: Query) => query.state.status === 'error',
} satisfies QueryFilters

export function invitationQuery(id: string) {
  return {
    queryKey: ['invitation', id] as const,
    queryFn: () => authClient.organization.getInvitation({ query: { id } }),
    meta: { silent: true },
  }
}

// Its own key, so errors here stay silent
export const currentCompanyKey = [...workspaceKey, 'invitation'] as const

export const currentCompanyQuery = {
  ...workspaceQuery,
  queryKey: currentCompanyKey,
  meta: { silent: true },
}
