import { useTranslation } from 'react-i18next'
import { env } from '@/core/config/env'
import { Button } from '@/ui/components/ui/button'

export function GoogleLogin() {
  const { t } = useTranslation()

  return (
    <Button asChild size="lg" className="w-full">
      <a href={`${env.VITE_API_URL}/api/v1/auth/google/redirect`}>{t('login.google')}</a>
    </Button>
  )
}
