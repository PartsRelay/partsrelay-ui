import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { createSetupForm } from '@/modules/workspaces/core/setup'
import { preferredLocale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { AccountActions } from '@/modules/workspaces/ui/account-actions'
import { InvitationHint } from '@/modules/workspaces/ui/invitation-hint'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { TextField } from '@/ui/components/text-field'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

type WorkspaceFormProps = { workspace: Workspace; askName: boolean }

export function WorkspaceForm({ workspace, askName }: WorkspaceFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form] = useState(() =>
    createSetupForm(workspace, { askName, browserLocale: preferredLocale(navigator.languages) })
  )
  const { name, locale, userName, errors } = useSelector(form)
  const { client, pending, run } = useBetterAuthAction()
  const nameInput = useRef<HTMLInputElement>(null)
  const userNameInput = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('setup.title')}</AuthTitle>
        <CardDescription>{t('setup.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const values = form.actions.submit()
            if (values) {
              const { name, locale, userName } = values
              const metadata = { ...workspace.metadata, setup: 'done' }

              void run(async () => {
                if (userName) await authClient.updateUser({ name: userName })
                // Setup flag last, so a failure keeps the setup open
                await authClient.organization.update({ data: { name, locale, metadata } })
                client.setQueryData(
                  workspaceKey,
                  (current) =>
                    current && { ...current, name, locale, metadata: JSON.stringify(metadata) }
                )
                await Promise.all([
                  client.invalidateQueries({ queryKey: workspaceKey }),
                  client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
                ])
                await navigate({ to: '/' })
              })

              return
            }

            const invalid = form.state.errors.name ? nameInput : userNameInput
            invalid.current?.focus()
          }}
        >
          <FieldGroup>
            <InvitationHint />
            <TextField
              label={t('setup.form.name')}
              required
              description={t('setup.form.name-hint')}
              error={errors.name && t(...errors.name)}
            >
              <Input
                ref={nameInput}
                autoComplete="organization"
                value={name}
                onChange={(event) => form.actions.setName(event.target.value)}
              />
            </TextField>
            <LocaleSelect
              label={t('setup.form.language')}
              description={t('setup.form.language-hint')}
              value={locale}
              onValueChange={form.actions.setLocale}
            />
            {askName && (
              <TextField
                label={t('setup.form.user-name')}
                required
                description={t('setup.form.user-name-hint')}
                error={errors.userName && t(...errors.userName)}
              >
                <Input
                  ref={userNameInput}
                  autoComplete="name"
                  value={userName}
                  onChange={(event) => form.actions.setUserName(event.target.value)}
                />
              </TextField>
            )}
            <Field>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                {t('setup.form.submit')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <AccountActions />
      </CardFooter>
    </Card>
  )
}
