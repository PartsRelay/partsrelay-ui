import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { createUserNameForm, type ProfileView } from '@/modules/auth/core/profile'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { Facts } from '@/ui/components/facts'
import { PersonItem } from '@/ui/components/person-item'
import { TextField } from '@/ui/components/text-field'
import { useAction } from '@/ui/hooks/use-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'

type IdentityCardProps = { view: ProfileView; userName: string }

export function IdentityCard({ view, userName }: IdentityCardProps) {
  const { t } = useTranslation()
  const [form] = useState(() => createUserNameForm(userName))
  const { draft, error } = useSelector(form)
  const { client, pending, run } = useAction()
  const input = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.identity.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.identity.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <PersonItem name={view.name} email={view.email} image={view.image} />
        <Facts
          className="text-sm"
          items={[
            { label: t('profile.identity.company'), value: view.company },
            { label: t('profile.identity.role'), value: t(...view.roleLabel) },
          ]}
        />
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const value = form.actions.submit(userName)
            if (value) {
              void run(
                async () => {
                  await authClient.updateUser({ name: value })
                  form.actions.reset(value)
                  await Promise.all([
                    client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
                    client.invalidateQueries({ queryKey: workspaceKey }),
                  ])
                },
                { notice: t('profile.notices.nameSaved') }
              )
            } else if (form.state.error) input.current?.focus()
          }}
        >
          <FieldGroup>
            <TextField
              label={t('profile.identity.name')}
              required
              description={t('profile.identity.nameHint')}
              error={error && t(...error)}
            >
              <Input
                ref={input}
                autoComplete="name"
                value={draft}
                onChange={(event) => form.actions.change(event.target.value)}
              />
            </TextField>
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {t('profile.identity.save')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
