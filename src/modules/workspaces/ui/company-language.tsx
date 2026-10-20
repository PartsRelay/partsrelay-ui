import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { changeLanguageMutation } from '@/modules/workspaces/core/company.mutation'
import type { Locale } from '@/modules/workspaces/core/locale'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function CompanyLanguage({ locale }: { locale: Locale }) {
  const { t } = useTranslation()
  const change = useMutation(changeLanguageMutation)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('company.language.title')}</h2>
        </CardTitle>
        <CardDescription>{t('company.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LocaleSelect
          label={t('company.language.label')}
          value={locale}
          disabled={change.isPending}
          onValueChange={(next) => {
            if (next !== locale) change.mutate(next)
          }}
        />
      </CardContent>
    </Card>
  )
}
