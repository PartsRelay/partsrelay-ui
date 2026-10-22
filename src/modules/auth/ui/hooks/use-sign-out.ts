import { env } from '@/env'
import { authClient } from '@/modules/auth/core/auth.client'
import { signOutOfLocalReview } from '@/modules/auth/core/local-review'
import { endSession } from '@/modules/auth/core/session.query'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

export function useSignOut() {
  const { client, pending, run } = useBetterAuthAction()

  const signOut = () =>
    run(
      async () => {
        const localSessionEnded = env.LOCAL_REVIEW_AUTH && (await signOutOfLocalReview())
        if (!localSessionEnded) await authClient.signOut()
        endSession(client)
      },
      { notice: 'auth.notices.signed-out' }
    )

  return { pending, signOut }
}
