import { authClient } from '@/modules/auth/core/auth.client'
import { endSession } from '@/modules/auth/core/session.query'
import { useAction } from '@/ui/hooks/use-action'

export function useSignOut() {
  const { client, pending, run } = useAction()

  const signOut = () =>
    run(
      async () => {
        await authClient.signOut()
        endSession(client)
      },
      { notice: 'auth.notices.signed-out' }
    )

  return { pending, signOut }
}
