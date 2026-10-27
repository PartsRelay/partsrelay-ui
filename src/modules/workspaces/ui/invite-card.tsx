import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { inviteDefaults, inviteeError, roleHint } from '@/modules/workspaces/core/invite-form'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { RoleField } from '@/modules/workspaces/ui/role-field'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

export function InviteCard() {
  const { t } = useTranslation()
  const { me } = useMe()
  const { client, run } = useBetterAuthAction()
  const form = useForm({
    defaultValues: inviteDefaults(me),
    onSubmit: async ({ value, formApi }) => {
      const invitee = { ...value, email: value.email.trim().toLowerCase() }
      const result = await run(
        async () => {
          try {
            await authClient.organization.inviteMember(invitee)
            formApi.resetField('email')
          } finally {
            await client.invalidateQueries({ queryKey: workspaceKey })
          }
        },
        {
          notice: 'workspace.notices.invitation-sent',
          values: { email: invitee.email },
          silent: (error) => inviteeError(error) !== null,
        }
      )
      const error = result.ok ? null : inviteeError(result.error)
      if (error) formApi.setErrorMap({ onSubmit: { fields: { email: error } } })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('workspace.invite.title')}</CardHeading>
        <CardDescription>{t('workspace.invite.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form}>
          <FieldGroup>
            <form.Field name="email">
              {(field) => (
                <InputField
                  field={field}
                  label={t('workspace.invite.email')}
                  type="email"
                  autoComplete="off"
                  placeholder={t('workspace.invite.email-placeholder')}
                />
              )}
            </form.Field>
            <form.Field name="role">
              {(field) => (
                <RoleField
                  label={t('workspace.invite.role')}
                  roles={me.permissions.inviteRoles}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  hint={t(...roleHint(field.state.value, me))}
                />
              )}
            </form.Field>
            <Field orientation="horizontal">
              <SubmitButton form={form}>{t('workspace.invite.send')}</SubmitButton>
            </Field>
          </FieldGroup>
        </Form>
      </CardContent>
    </Card>
  )
}
