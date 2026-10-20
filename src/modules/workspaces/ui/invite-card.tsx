import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { message } from '@/core/message'
import { createInviteForm, roleHint } from '@/modules/workspaces/core/invite-form'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { TextField } from '@/ui/components/text-field'
import { useAction } from '@/ui/hooks/use-action'
import { RoleField } from '@/modules/workspaces/ui/role-field'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

export function InviteCard() {
  const { t } = useTranslation()
  const { workspace, me } = useMe()
  const [form] = useState(() => createInviteForm(me))
  const draft = useSelector(form)
  const { client, pending, run } = useAction()
  const email = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('team.invite.title')}</h2>
        </CardTitle>
        <CardDescription>{t('team.invite.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const invitee = form.actions.submit(workspace)
            if (!invitee) return email.current?.focus()

            void run(
              async () => {
                try {
                  await authClient.organization.inviteMember(invitee)
                  form.actions.reset()
                } finally {
                  await client.invalidateQueries({ queryKey: workspaceKey })
                }
              },
              { notice: message('team.notices.invitationSent', { email: invitee.email }) }
            )
          }}
        >
          <FieldGroup>
            <TextField label={t('team.invite.email')} error={draft.error && t(...draft.error)}>
              <Input
                ref={email}
                type="email"
                autoComplete="off"
                placeholder={t('team.invite.emailPlaceholder')}
                value={draft.email}
                onChange={(event) => form.actions.setEmail(event.target.value)}
              />
            </TextField>
            <RoleField
              label={t('team.invite.role')}
              roles={me.permissions.inviteRoles}
              value={draft.role}
              onValueChange={form.actions.setRole}
              hint={t(...roleHint(draft.role, me))}
            />
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                {t('team.invite.send')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
