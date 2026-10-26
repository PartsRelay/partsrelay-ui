import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { authClient } from '@/modules/auth/core/auth.client'
import type { ProfileView } from '@/modules/auth/core/profile'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { Facts } from '@/ui/components/facts'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { PersonItem } from '@/ui/components/person-item'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

type IdentityCardProps = { view: ProfileView; userName: string }

export function IdentityCard({ view, userName }: IdentityCardProps) {
  const { t } = useTranslation()
  const { client, run } = useBetterAuthAction()
  const form = useForm({
    defaultValues: { name: userName },
    onSubmit: async ({ value, formApi }) => {
      const name = value.name.trim()
      if (name === userName.trim()) return

      const result = await run(
        async () => {
          await authClient.updateUser({ name })
          await Promise.all([
            client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
            client.invalidateQueries({ queryKey: workspaceKey }),
          ])
        },
        { notice: 'profile.notices.name-saved' }
      )
      if (result.ok) formApi.reset({ name }, { keepDefaultValues: true })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.identity.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.identity.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <PersonItem name={view.name} description={view.email} image={view.image} />
        <Facts
          className="text-sm"
          items={[
            { label: t('profile.identity.company'), value: view.company },
            { label: t('profile.identity.role'), value: t(...view.roleLabel) },
          ]}
        />
        <Form form={form}>
          <FieldGroup>
            <form.Field
              name="name"
              validators={{ onSubmit: z.string().trim().min(1, 'profile.errors.name-required') }}
            >
              {(field) => (
                <InputField
                  field={field}
                  label={t('profile.identity.name')}
                  required
                  description={t('profile.identity.name-hint')}
                  autoComplete="name"
                />
              )}
            </form.Field>
            <Field orientation="horizontal">
              <SubmitButton form={form}>{t('profile.identity.save')}</SubmitButton>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </Card>
  )
}
