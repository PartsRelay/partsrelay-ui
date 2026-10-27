import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { setupDefaults, setupSchemas } from '@/modules/workspaces/core/setup'
import { toLocale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { AuthTitle } from '@/ui/components/auth-title'
import { AccountActions } from '@/modules/workspaces/ui/account-actions'
import { InvitationHint } from '@/modules/workspaces/ui/invitation-hint'
import { LocaleSelect } from '@/ui/components/locale-select'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

type WorkspaceFormProps = { workspace: Workspace; askName: boolean }

export function WorkspaceForm({ workspace, askName }: WorkspaceFormProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { client, run } = useBetterAuthAction()
  const form = useForm({
    defaultValues: setupDefaults(workspace, toLocale(i18n.resolvedLanguage)),
    onSubmit: async ({ value }) => {
      const name = value.name.trim()
      const { locale } = value
      const metadata = { ...workspace.metadata, setup: 'done' }

      await run(async () => {
        if (askName) await authClient.updateUser({ name: value.userName.trim() })
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
        <Form form={form}>
          <FieldGroup>
            <InvitationHint />
            <form.Field name="name" validators={{ onSubmit: setupSchemas.name }}>
              {(field) => (
                <InputField
                  field={field}
                  label={t('setup.form.name')}
                  required
                  description={t('setup.form.name-hint')}
                  autoComplete="organization"
                />
              )}
            </form.Field>
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
              <form.Field name="userName" validators={{ onSubmit: setupSchemas.userName }}>
                {(field) => (
                  <InputField
                    field={field}
                    label={t('setup.form.user-name')}
                    required
                    description={t('setup.form.user-name-hint')}
                    autoComplete="name"
                  />
                )}
              </form.Field>
            )}
            <Field>
              <SubmitButton form={form}>{t('setup.form.submit')}</SubmitButton>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <AccountActions />
      </CardFooter>
    </Card>
  )
}
