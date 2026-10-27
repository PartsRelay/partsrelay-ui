import { useTranslation } from 'react-i18next'
import { useSession } from '@/modules/auth/ui/hooks/use-session'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'
import { Button } from '@/ui/components/ui/button'

export function AccountActions() {
  const { t } = useTranslation()
  const { email } = useSession()
  const { pending, signOut } = useSignOut({ to: '/login' })

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
      <span className="wrap-anywhere">{t('setup.account.signed-in-as', { email })}</span>
      <Button variant="link" size="sm" disabled={pending} onClick={() => void signOut()}>
        {t('setup.account.sign-out')}
      </Button>
    </p>
  )
}
