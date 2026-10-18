import type { MutationOptions, Query, QueryFilters } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { message } from '@/modules/core/shared/message'
import { workspaceQuery } from '@/modules/core/workspace/workspace.query'

export const invitationKeys = {
  detail: (id: string) => ['invitation', id] as const,
  company: ['invitation-company'] as const,
}

export const failedQueries = {
  type: 'active',
  predicate: (query: Query) => query.state.status === 'error',
} satisfies QueryFilters

export function invitationQuery(id: string) {
  return {
    queryKey: invitationKeys.detail(id),
    queryFn: () => authClient.organization.getInvitation({ query: { id } }),
    meta: { silent: true },
  }
}

export const currentCompanyQuery = {
  ...workspaceQuery,
  queryKey: invitationKeys.company,
  meta: { silent: true },
}

export function acceptInvitationMutation(id: string, workspace: string) {
  return {
    mutationKey: ['invitation', 'accept', id],
    mutationFn: () => authClient.organization.acceptInvitation({ invitationId: id }),
    onSuccess: (_data, _variables, _result, { client }) =>
      client.removeQueries({ type: 'inactive' }),
    onError: (_error, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: invitationKeys.company }),
    meta: { notice: message('invitation.notices.joined', { workspace }), silent: true },
  } satisfies MutationOptions<unknown, Error, void>
}
