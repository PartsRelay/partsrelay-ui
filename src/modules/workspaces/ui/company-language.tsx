import { useTranslation } from 'react-i18next'
import type { Locale } from '@/modules/workspaces/core/locale'
import { updateCompany } from '@/modules/workspaces/core/workspace.mutation'
import { LocaleSelect } from '@/ui/components/locale-select'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function CompanyLanguage({ locale }: { locale: Locale }) {
  const { t } = useTranslation()
  const { client, pending, run } = useBetterAuthAction()

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('company.language.title')}</CardHeading>
        <CardDescription>{t('company.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LocaleSelect
          label={t('company.language.label')}
          value={locale}
          disabled={pending}
          onValueChange={(next) => {
            if (next === locale) return

            void run(() => updateCompany(client, { locale: next }), {
              notice: 'company.notices.language',
              values: { language: t(`languages.${next}`) },
            })
          }}
        />
      </CardContent>
    </Card>
  )
}
