import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { companyNameSchema } from '@/modules/workspaces/core/workspace'
import { updateCompany } from '@/modules/workspaces/core/workspace.mutation'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

export function CompanyName({ name }: { name: string }) {
  const { t } = useTranslation()
  const { client, run } = useBetterAuthAction()
  const form = useForm({
    defaultValues: { name },
    onSubmit: async ({ value, formApi }) => {
      const next = value.name.trim()
      if (next === name.trim()) return

      const result = await run(() => updateCompany(client, { name: next }), {
        notice: 'company.notices.renamed',
      })
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
        <Form form={form}>
          <FieldGroup>
            <form.Field name="name" validators={{ onSubmit: companyNameSchema }}>
              {(field) => (
                <InputField
                  field={field}
                  label={t('company.name.label')}
                  required
                  autoComplete="organization"
                />
              )}
            </form.Field>
            <Field orientation="horizontal">
              <SubmitButton form={form}>{t('company.name.save')}</SubmitButton>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </Card>
  )
}
