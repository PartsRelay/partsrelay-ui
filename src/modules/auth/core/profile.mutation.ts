import type { MutationOptions } from '@tanstack/query-core'
import { updateUser } from '@/core/api/auth/endpoints/default/default'
import { postOrganizationLeave } from '@/core/api/auth/endpoints/organization/organization'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

export const updateNameMutation = {
  mutationKey: ['profile', 'name'],
  mutationFn: (name: string) => updateUser({ name }),
  onSuccess: (_data, _name, _result, { client }) =>
    Promise.all([
      client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
      client.invalidateQueries({ queryKey: workspaceKey }),
    ]),
  meta: { notice: message('profile.notices.nameSaved') },
} satisfies MutationOptions<unknown, Error, string>

export function leaveCompanyMutation(workspace: Workspace) {
  return {
    mutationKey: ['profile', 'leave', workspace.id],
    mutationFn: () => postOrganizationLeave({ organizationId: workspace.id }),
    // The core deletes the account, so this ends the session
    onSuccess: (_data, _variables, _result, { client }) => {
      client.clear()
      client.setQueryData(sessionQuery.queryKey, null)
    },
    meta: { notice: message('profile.notices.left', { company: workspace.name }) },
  } satisfies MutationOptions<unknown, Error, void>
}
