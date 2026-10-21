import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/modules/auth/ui/hooks/use-session'
import { Button } from '@/ui/components/ui/button'

export function AccountActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { email, signingOut, signOut } = useSession()

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
      <span className="wrap-anywhere">{t('setup.account.signed-in-as', { email })}</span>
      <Button
        variant="link"
        size="sm"
        disabled={signingOut}
        onClick={async () => {
          if ((await signOut()).ok) await navigate({ to: '/login' })
        }}
      >
        {t('setup.account.sign-out')}
      </Button>
    </p>
  )
}
