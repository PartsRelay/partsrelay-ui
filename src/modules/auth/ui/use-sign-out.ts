import { authClient } from '@/modules/auth/core/auth.client'
import { endSession } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { useAction } from '@/ui/hooks/use-action'

export function useSignOut() {
  const { client, pending, run } = useAction()

  const signOut = () =>
    run(
      async () => {
        await authClient.signOut()
        endSession(client)
      },
      { notice: message('auth.notices.signedOut') }
    )

  return { pending, signOut }
}
