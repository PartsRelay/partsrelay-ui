import { useNavigate } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function SessionCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pending, signOut } = useSignOut()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.session.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.session.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if ((await signOut()).ok) await navigate({ to: '/login' })
          }}
        >
          <LogOutIcon data-icon="inline-start" />
          {t('profile.session.sign-out')}
        </Button>
      </CardContent>
    </Card>
  )
}
