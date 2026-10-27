import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { googleSignInURL, type SignInFlow } from '@/modules/auth/core/sign-in'
import { Button } from '@/ui/components/ui/button'
import { Spinner } from '@/ui/components/ui/spinner'

export function GoogleLogin({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() => {
        setPending(true)
        window.location.assign(googleSignInURL(flow))
      }}
    >
      {pending && <Spinner data-icon="inline-start" />}
      {t('login.google')}
    </Button>
  )
}
