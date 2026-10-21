import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { requiredText, useAppForm } from '@/form'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

export function CompanyName({ name }: { name: string }) {
  const { t } = useTranslation()
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { name },
    onSubmit: async ({ value, formApi }) => {
      const next = value.name.trim()
      if (next === name.trim()) return

      const result = await run(
        () =>
          optimistic<FullOrganization>(
            client,
            workspaceKey,
            (organization) => ({ ...organization, name: next }),
            () => authClient.organization.update({ data: { name: next } })
          ),
        { notice: 'company.notices.renamed' }
      )
      // The prop stays the default and catches up later
      if (result.ok) formApi.reset({ name: next }, { keepDefaultValues: true })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('company.name.title')}</h2>
        </CardTitle>
        <CardDescription>{t('company.name.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              <form.AppField
                name="name"
                validators={{ onSubmit: requiredText('company.errors.name-required') }}
              >
                {(field) => (
                  <field.InputField
                    label={t('company.name.label')}
                    required
                    autoComplete="organization"
                  />
                )}
              </form.AppField>
              <Field orientation="horizontal">
                <form.SubmitButton>{t('company.name.save')}</form.SubmitButton>
              </Field>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  )
}
