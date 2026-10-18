import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'

export const signOutMutation = {
  mutationKey: ['sign-out'],
  mutationFn: () => authClient.signOut(),
  onSuccess: (_data, _variables, _result, { client }) => {
    client.clear()
    client.setQueryData(sessionQuery.queryKey, null)
  },
  meta: { notice: message('auth.notices.signedOut') },
} satisfies MutationOptions<unknown, Error, void>
