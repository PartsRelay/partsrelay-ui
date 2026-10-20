import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createCompanyNameForm } from '@/modules/workspaces/core/company'
import { renameCompanyMutation } from '@/modules/workspaces/core/company.mutation'
import { TextField } from '@/ui/components/text-field'
import { useT } from '@/ui/hooks/use-t'
import { Button } from '@/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card'
import { Input } from '@/ui/components/input'

export function CompanyName({ name }: { name: string }) {
  const { t } = useTranslation()
  const translate = useT()
  const [form] = useState(() => createCompanyNameForm(name))
  const { draft, error } = useSelector(form)
  const rename = useMutation(renameCompanyMutation)
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
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const value = form.actions.submit(name)
            if (value) rename.mutate(value, { onSuccess: () => form.actions.reset(value) })
            else if (form.state.error) input.current?.focus()
          }}
        >
          <TextField label={t('company.name.label')} required error={error && translate(error)}>
            <Input
              ref={input}
              autoComplete="organization"
              value={draft}
              onChange={(event) => form.actions.change(event.target.value)}
            />
          </TextField>
          <Button type="submit" className="justify-self-start" disabled={rename.isPending}>
            {t('company.name.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
