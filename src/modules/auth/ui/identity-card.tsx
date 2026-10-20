import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createUserNameForm, type ProfileView } from '@/modules/auth/core/profile'
import { updateNameMutation } from '@/modules/auth/core/profile.mutation'
import { Facts } from '@/ui/components/facts'
import { PersonItem } from '@/ui/components/person-item'
import { TextField } from '@/ui/components/text-field'
import { useT } from '@/ui/hooks/use-t'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'

type IdentityCardProps = { view: ProfileView; userName: string }

export function IdentityCard({ view, userName }: IdentityCardProps) {
  const { t } = useTranslation()
  const translate = useT()
  const [form] = useState(() => createUserNameForm(userName))
  const { draft, error } = useSelector(form)
  const rename = useMutation(updateNameMutation)
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
            { label: t('profile.identity.role'), value: translate(view.roleLabel) },
          ]}
        />
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const value = form.actions.submit(userName)
            if (value) rename.mutate(value, { onSuccess: () => form.actions.reset(value) })
            else if (form.state.error) input.current?.focus()
          }}
        >
          <FieldGroup>
            <TextField
              label={t('profile.identity.name')}
              required
              description={t('profile.identity.nameHint')}
              error={error && translate(error)}
            >
              <Input
                ref={input}
                autoComplete="name"
                value={draft}
                onChange={(event) => form.actions.change(event.target.value)}
              />
            </TextField>
            <Field orientation="horizontal">
              <Button type="submit" disabled={rename.isPending}>
                {t('profile.identity.save')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
