import type { MutationOptions } from '@tanstack/query-core'
import { updateUser } from '@/core/api/auth/endpoints/default/default'
import { postOrganizationUpdate } from '@/core/api/auth/endpoints/organization/organization'
import { sessionQuery } from '@/modules/auth/core/session.query'
import type { SetupValues } from '@/modules/workspaces/core/setup'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

export function completeSetupMutation(workspace: Workspace) {
  const metadata = { ...workspace.metadata, setup: 'done' }

  return {
    mutationKey: ['setup', 'complete'],
    mutationFn: async ({ name, locale, userName }: SetupValues) => {
      if (userName) await updateUser({ name: userName })
      // Setup flag last, so a failure keeps the setup open
      await postOrganizationUpdate({ data: { name, locale, metadata } })
    },
    onSuccess: (_data, { name, locale }, _result, { client }) => {
      client.setQueryData(
        workspaceKey,
        (current) => current && { ...current, name, locale, metadata: JSON.stringify(metadata) }
      )

      return Promise.all([
        client.invalidateQueries({ queryKey: workspaceKey }),
        client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
      ])
    },
  } satisfies MutationOptions<unknown, Error, SetupValues>
}
