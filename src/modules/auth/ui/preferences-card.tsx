import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toLocale } from '@/modules/workspaces/core/locale'
import { LocaleSelect } from '@/ui/components/locale-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function PreferencesCard() {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.preferences.title')}</h2>
        </CardTitle>
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
