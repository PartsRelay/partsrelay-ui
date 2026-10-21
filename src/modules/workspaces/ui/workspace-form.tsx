import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { setupDefaults } from '@/modules/workspaces/core/setup'
import { toLocale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { AccountActions } from '@/modules/workspaces/ui/account-actions'
import { InvitationHint } from '@/modules/workspaces/ui/invitation-hint'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { requiredText, useAppForm } from '@/form'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

type WorkspaceFormProps = { workspace: Workspace; askName: boolean }

export function WorkspaceForm({ workspace, askName }: WorkspaceFormProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: setupDefaults(workspace, toLocale(i18n.resolvedLanguage)),
    onSubmit: async ({ value }) => {
      const name = value.name.trim()
      const { locale } = value
      const metadata = { ...workspace.metadata, setup: 'done' }

      await run(async () => {
        if (askName) await authClient.updateUser({ name: value.userName.trim() })
        // Setup flag last, so a failure keeps the setup open
        await authClient.organization.update({ data: { name, locale, metadata } })
        client.setQueryData(
          workspaceKey,
          (current) => current && { ...current, name, locale, metadata: JSON.stringify(metadata) }
        )
        await Promise.all([
          client.invalidateQueries({ queryKey: workspaceKey }),
          client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
        ])
        await navigate({ to: '/' })
      })
    },
  })

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('setup.title')}</AuthTitle>
        <CardDescription>{t('setup.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              <InvitationHint />
              <form.AppField
                name="name"
                validators={{ onSubmit: requiredText('setup.errors.name-required') }}
              >
                {(field) => (
                  <field.InputField
                    label={t('setup.form.name')}
                    required
                    description={t('setup.form.name-hint')}
                    autoComplete="organization"
                  />
                )}
              </form.AppField>
              <form.Field name="locale">
                {(field) => (
                  <LocaleSelect
                    label={t('setup.form.language')}
                    description={t('setup.form.language-hint')}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  />
                )}
              </form.Field>
              {askName && (
                <form.AppField
                  name="userName"
                  validators={{ onSubmit: requiredText('setup.errors.user-name-required') }}
                >
                  {(field) => (
                    <field.InputField
                      label={t('setup.form.user-name')}
                      required
                      description={t('setup.form.user-name-hint')}
                      autoComplete="name"
                    />
                  )}
                </form.AppField>
              )}
              <Field>
                <form.SubmitButton>{t('setup.form.submit')}</form.SubmitButton>
              </Field>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </CardContent>
      <CardFooter className="justify-center">
        <AccountActions />
      </CardFooter>
    </Card>
  )
}
