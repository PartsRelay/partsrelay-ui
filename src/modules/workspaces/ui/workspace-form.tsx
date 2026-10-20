import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createSetupForm } from '@/modules/workspaces/core/setup'
import { completeSetupMutation } from '@/modules/workspaces/core/setup.mutation'
import { preferredLocale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { AccountActions } from '@/modules/workspaces/ui/account-actions'
import { InvitationHint } from '@/modules/workspaces/ui/invitation-hint'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { TextField } from '@/ui/components/text-field'
import { useT } from '@/ui/hooks/use-t'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

type WorkspaceFormProps = { workspace: Workspace; askName: boolean }

export function WorkspaceForm({ workspace, askName }: WorkspaceFormProps) {
  const { t } = useTranslation()
  const translate = useT()
  const navigate = useNavigate()
  const [form] = useState(() =>
    createSetupForm(workspace, { askName, browserLocale: preferredLocale(navigator.languages) })
  )
  const { name, locale, userName, errors } = useSelector(form)
  const save = useMutation(completeSetupMutation(workspace))
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
              save.mutate(values, { onSuccess: () => void navigate({ to: '/' }) })

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
              description={t('setup.form.nameHint')}
              error={errors.name && translate(errors.name)}
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
              description={t('setup.form.languageHint')}
              value={locale}
              onValueChange={form.actions.setLocale}
            />
            {askName && (
              <TextField
                label={t('setup.form.userName')}
                required
                description={t('setup.form.userNameHint')}
                error={errors.userName && translate(errors.userName)}
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
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Spinner data-icon="inline-start" />}
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
