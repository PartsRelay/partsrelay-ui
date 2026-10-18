import type { MutationOptions, Query, QueryFilters } from '@tanstack/query-core'
import {
  getGetOrganizationGetInvitationQueryOptions,
  postOrganizationAcceptInvitation,
} from '@/core/api/auth/endpoints/organization/organization'
import { message } from '@/core/message'
import { toWorkspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey, workspaceQuery } from '@/modules/workspaces/core/workspace.query'

export const failedQueries = {
  type: 'active',
  predicate: (query: Query) => query.state.status === 'error',
} satisfies QueryFilters

export function invitationQuery(id: string) {
  return getGetOrganizationGetInvitationQueryOptions({ id }, { query: { meta: { silent: true } } })
}

// Its own key, so errors here stay silent
export const currentCompanyKey = [...workspaceKey, 'invitation'] as const

export const currentCompanyQuery = {
  ...workspaceQuery,
  queryKey: currentCompanyKey,
  select: toWorkspace,
  meta: { silent: true },
}

export function acceptInvitationMutation(id: string, workspace: string) {
  return {
    mutationKey: ['invitation', 'accept', id],
    mutationFn: () => postOrganizationAcceptInvitation({ invitationId: id }),
    onSuccess: (_data, _variables, _result, { client }) =>
      client.removeQueries({ type: 'inactive' }),
    onError: (_error, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: currentCompanyKey }),
    meta: { notice: message('invitation.notices.joined', { workspace }), silent: true },
  } satisfies MutationOptions<unknown, Error, void>
}
