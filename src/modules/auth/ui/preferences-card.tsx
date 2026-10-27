import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toLocale } from '@/modules/workspaces/core/locale'
import { LocaleSelect } from '@/ui/components/locale-select'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function PreferencesCard() {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('profile.preferences.title')}</CardHeading>
        <CardDescription>{t('profile.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LocaleSelect
          label={t('profile.preferences.language')}
          value={toLocale(i18n.language)}
          onValueChange={async (locale) => {
            await i18n.changeLanguage(locale)
            await client.invalidateQueries()
          }}
        />
      </CardContent>
    </Card>
  )
}
