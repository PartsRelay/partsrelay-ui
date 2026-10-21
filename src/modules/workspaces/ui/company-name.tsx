import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { createCompanyNameForm } from '@/modules/workspaces/core/company'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { TextField } from '@/ui/components/text-field'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'

export function CompanyName({ name }: { name: string }) {
  const { t } = useTranslation()
  const [form] = useState(() => createCompanyNameForm(name))
  const { draft, error } = useSelector(form)
  const { client, pending, run } = useBetterAuthAction()
  const input = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('company.name.title')}</h2>
        </CardTitle>
        <CardDescription>{t('company.name.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const value = form.actions.submit(name)
            if (!value) {
              if (form.state.error) input.current?.focus()
              return
            }

            void run(
              async () => {
                await optimistic<FullOrganization>(
                  client,
                  workspaceKey,
                  (organization) => ({ ...organization, name: value }),
                  () => authClient.organization.update({ data: { name: value } })
                )
                form.actions.reset(value)
              },
              { notice: 'company.notices.renamed' }
            )
          }}
        >
          <FieldGroup>
            <TextField label={t('company.name.label')} required error={error && t(...error)}>
              <Input
                ref={input}
                autoComplete="organization"
                value={draft}
                onChange={(event) => form.actions.change(event.target.value)}
              />
            </TextField>
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {t('company.name.save')}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
