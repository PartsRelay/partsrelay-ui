import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { message } from '@/modules/core/shared/message'

export const signOutMutation = {
  mutationKey: ['sign-out'],
  mutationFn: () => authClient.signOut(),
  onSuccess: (_data, _variables, _result, { client }) => {
    client.clear()
    client.setQueryData(sessionQuery.queryKey, null)
  },
  meta: { notice: message('auth.notices.signedOut') },
} satisfies MutationOptions<unknown, Error, void>
