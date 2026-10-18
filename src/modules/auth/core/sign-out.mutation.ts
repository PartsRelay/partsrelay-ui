import type { MutationOptions } from '@tanstack/query-core'
import { signOut } from '@/core/api/auth/endpoints/default/default'
import { message } from '@/core/message'
import { cancelOneTap } from '@/modules/auth/core/one-tap'
import { sessionQuery } from '@/modules/auth/core/session.query'

export const signOutMutation = {
  mutationKey: ['sign-out'],
  mutationFn: () => signOut({}),
  onSuccess: (_data, _variables, _result, { client }) => {
    cancelOneTap({ signedOut: true })
    client.clear()
    client.setQueryData(sessionQuery.queryKey, null)
  },
  meta: { notice: message('auth.notices.signedOut') },
} satisfies MutationOptions<unknown, Error, void>
