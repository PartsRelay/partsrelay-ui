import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { message } from '@/modules/core/shared/message'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

export const updateNameMutation = {
  mutationKey: ['profile', 'name'],
  mutationFn: (name: string) => authClient.updateUser({ name }),
  onSuccess: (_data, _name, _result, { client }) =>
    Promise.all([
      client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
      client.invalidateQueries({ queryKey: workspaceKeys.all }),
    ]),
  meta: { notice: message('profile.notices.nameSaved') },
} satisfies MutationOptions<unknown, Error, string>

export function leaveCompanyMutation(workspace: Workspace) {
  return {
    mutationKey: ['profile', 'leave', workspace.id],
    mutationFn: () => authClient.organization.leave({ organizationId: workspace.id }),
    // The core deletes the account, so this ends the session
    onSuccess: (_data, _variables, _result, { client }) => {
      client.clear()
      client.setQueryData(sessionQuery.queryKey, null)
    },
    meta: { notice: message('profile.notices.left', { company: workspace.name }) },
  } satisfies MutationOptions<unknown, Error, void>
}
