import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createInviteForm, roleHint } from '@/modules/workspaces/core/invite-form'
import { inviteMutation } from '@/modules/workspaces/core/team.mutation'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { TextField } from '@/ui/components/text-field'
import { useT } from '@/ui/hooks/use-t'
import { RoleField } from '@/modules/workspaces/ui/role-toggle'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

export function InviteCard() {
  const { t } = useTranslation()
  const translate = useT()
  const { workspace, me } = useMe()
  const [form] = useState(() => createInviteForm(me))
  const draft = useSelector(form)
  const invite = useMutation(inviteMutation)
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
            if (invitee) invite.mutate(invitee, { onSuccess: form.actions.reset })
            else email.current?.focus()
          }}
        >
          <FieldGroup>
            <TextField label={t('team.invite.email')} error={draft.error && translate(draft.error)}>
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
              hint={translate(roleHint(draft.role, me))}
            />
            <Field orientation="horizontal">
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && <Spinner data-icon="inline-start" />}
                {t('team.invite.send')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
