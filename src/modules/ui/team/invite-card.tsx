import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createInviteForm, roleHint } from '@/modules/core/team/invite-form'
import { inviteMutation } from '@/modules/core/team/team.mutation'
import { useMe } from '@/modules/ui/app/use-me'
import { TextField } from '@/modules/ui/shared/text-field'
import { useT } from '@/modules/ui/shared/use-t'
import { RoleToggle } from '@/modules/ui/team/role-toggle'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { FieldDescription, FieldLegend, FieldSet } from '@/ui/components/ui/field'
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
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            const invitee = form.actions.submit(workspace)
            if (invitee) invite.mutate(invitee, { onSuccess: form.actions.reset })
            else email.current?.focus()
          }}
        >
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
          <FieldSet className="gap-2">
            <FieldLegend variant="label">{t('team.invite.role')}</FieldLegend>
            <RoleToggle
              label={t('team.invite.role')}
              roles={me.permissions.inviteRoles}
              value={draft.role}
              onValueChange={form.actions.setRole}
            />
            <FieldDescription>{translate(roleHint(draft.role, me))}</FieldDescription>
          </FieldSet>
          <Button type="submit" className="justify-self-start" disabled={invite.isPending}>
            {invite.isPending && <Spinner data-icon="inline-start" />}
            {t('team.invite.send')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
