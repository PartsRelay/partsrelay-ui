import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
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
      // The client follows the Google redirect
      onClick={() => void run(() => authClient.signIn.social(googleSignIn(flow)))}
    >
      {pending && <Spinner data-icon="inline-start" />}
      {t('login.google')}
    </Button>
  )
}
