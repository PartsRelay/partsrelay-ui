import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { type Locale, localeNames } from '@/modules/workspaces/core/locale'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function CompanyLanguage({ locale }: { locale: Locale }) {
  const { t } = useTranslation()
  const { client, pending, run } = useBetterAuthAction()

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
          disabled={pending}
          onValueChange={(next) => {
            if (next === locale) return

            void run(
              () =>
                optimistic<FullOrganization>(
                  client,
                  workspaceKey,
                  (organization) => ({ ...organization, locale: next }),
                  () => authClient.organization.update({ data: { locale: next } })
                ),
              { notice: 'company.notices.language', values: { language: localeNames[next] } }
            )
          }}
        />
      </CardContent>
    </Card>
  )
}
