import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import type { SetupValues } from '@/modules/core/setup/setup'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

export function completeSetupMutation(workspace: Workspace) {
  const metadata = { ...workspace.metadata, setup: 'done' }

  return {
    mutationKey: ['setup', 'complete'],
    mutationFn: async ({ name, locale, userName }: SetupValues) => {
      if (userName) await authClient.updateUser({ name: userName })
      // Setup flag last, so a failure keeps the setup open
      await authClient.organization.update({ data: { name, locale, metadata } })
    },
    onSuccess: (_data, { name, locale }, _result, { client }) => {
      client.setQueryData<Workspace>(
        workspaceKeys.all,
        (current) => current && { ...current, name, locale, setup: 'done', metadata }
      )

      return Promise.all([
        client.invalidateQueries({ queryKey: workspaceKeys.all }),
        client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
      ])
    },
  } satisfies MutationOptions<unknown, Error, SetupValues>
}
