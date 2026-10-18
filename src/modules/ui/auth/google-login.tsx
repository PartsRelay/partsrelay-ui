import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/core/auth/auth.client'
import { Button } from '@/ui/components/ui/button'

export function GoogleLogin() {
  const { t } = useTranslation()
  const { origin } = window.location

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() =>
        void authClient.signIn.social({
          provider: 'google',
          callbackURL: new URL('/', origin).href,
          errorCallbackURL: new URL('/login', origin).href,
        })
      }
    >
      {t('login.google')}
    </Button>
  )
}
