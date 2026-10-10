import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { GoogleLogin } from '@/modules/ui/auth/google-login'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export const Route = createFileRoute('/(auth)/login')({ component: LoginPage })

function LoginPage() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleLogin />
      </CardContent>
    </Card>
  )
}
