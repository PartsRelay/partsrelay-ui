import { useTranslation } from 'react-i18next'
import { env } from '@/env'
import { authClient } from '@/modules/auth/core/auth.client'
import { signInToLocalReview } from '@/modules/auth/core/local-review'
import { googleSignIn, type SignInFlow } from '@/modules/auth/core/sign-in'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Spinner } from '@/ui/components/ui/spinner'

export function GoogleLogin({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  const { pending, run } = useBetterAuthAction()

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        void run(() =>
          env.LOCAL_REVIEW_AUTH
            ? signInToLocalReview(flow.back)
            : authClient.signIn.social(googleSignIn(flow))
        )
      }
    >
      {pending && <Spinner data-icon="inline-start" />}
      {t(env.LOCAL_REVIEW_AUTH ? 'login.local-review.action' : 'login.google')}
    </Button>
  )
}
