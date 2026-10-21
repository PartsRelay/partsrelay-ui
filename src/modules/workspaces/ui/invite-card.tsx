import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { inviteDefaults, inviteeError, roleHint } from '@/modules/workspaces/core/invite-form'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { useAppForm } from '@/form'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { RoleField } from '@/modules/workspaces/ui/role-field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

export function InviteCard() {
  const { t } = useTranslation()
  const { me } = useMe()
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
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
          notice: 'team.notices.invitation-sent',
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
        <CardTitle>
          <h2>{t('team.invite.title')}</h2>
        </CardTitle>
        <CardDescription>{t('team.invite.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              {/* The core checks the address, resubmitting clears its error */}
              <form.AppField name="email" validators={{ onSubmit: () => undefined }}>
                {(field) => (
                  <field.InputField
                    label={t('team.invite.email')}
                    type="email"
                    autoComplete="off"
                    placeholder={t('team.invite.email-placeholder')}
                  />
                )}
              </form.AppField>
              <form.Field name="role">
                {(field) => (
                  <RoleField
                    label={t('team.invite.role')}
                    roles={me.permissions.inviteRoles}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    hint={t(...roleHint(field.state.value, me))}
                  />
                )}
              </form.Field>
              <Field orientation="horizontal">
                <form.SubmitButton>{t('team.invite.send')}</form.SubmitButton>
              </Field>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  )
}
