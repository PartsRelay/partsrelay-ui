import { useSelector } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { errorMessage } from '@/core/errors'
import { type Locale, localeNames, serializeLocale } from '@/modules/workspaces/core/locale'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useAppForm } from '@/form'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function CompanyLanguage({
  locale,
  storedLocale,
}: {
  locale: Locale
  storedLocale: string | undefined
}) {
  const { t } = useTranslation()
  const { client, pending, error, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { locale },
    onSubmit: async ({ value }) => {
      if (value.locale === locale) return
      const next = serializeLocale(value.locale, storedLocale)
      await run(
        () =>
          optimistic<FullOrganization>(
            client,
            workspaceKey,
            (organization) => ({ ...organization, locale: next }),
            () => authClient.organization.update({ data: { locale: next } })
          ),
        {
          notice: 'company.notices.language',
          values: { language: localeNames[value.locale] },
          silent: true,
        }
      )
    },
  })
  const selectedLocale = useSelector(form.store, (state) => state.values.locale)

  return (
    <Card className="workspace-card">
      <CardHeader>
        <CardTitle>
          <h2>{t('company.language.title')}</h2>
        </CardTitle>
        <CardDescription>{t('company.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="workspace-inline-form">
            <form.Field name="locale">
              {(field) => (
                <LocaleSelect
                  label={t('company.language.label')}
                  value={field.state.value}
                  disabled={pending}
                  onValueChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.SubmitButton disabled={selectedLocale === locale}>
              {t('company.language.save')}
            </form.SubmitButton>
          </form.Form>
        </form.AppForm>
        {error != null && (
          <p className="workspace-form-error" role="alert">
            {t(...errorMessage(error))}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
