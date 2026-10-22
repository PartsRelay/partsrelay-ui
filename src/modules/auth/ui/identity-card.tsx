import { useTranslation } from 'react-i18next'
import { requiredText, useAppForm } from '@/form'
import { authClient } from '@/modules/auth/core/auth.client'
import type { ProfileView } from '@/modules/auth/core/profile'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/ui/avatar'
import { Badge } from '@/ui/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Field, FieldGroup } from '@/ui/components/ui/field'

export function IdentityCard({ view, userName }: { view: ProfileView; userName: string }) {
  const { t } = useTranslation()
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { name: userName },
    onSubmit: async ({ value, formApi }) => {
      const name = value.name.trim()
      if (name === userName.trim()) return

      const result = await run(
        async () => {
          await authClient.updateUser({ name })
          await Promise.all([
            client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
            client.invalidateQueries({ queryKey: workspaceKey }),
          ])
        },
        { notice: 'profile.notices.name-saved' }
      )
      if (result.ok) formApi.reset({ name }, { keepDefaultValues: true })
    },
  })
  const initials = view.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="workspace-card identity-card">
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.identity.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.identity.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="profile-identity">
          <Avatar className="profile-avatar">
            {view.image && <AvatarImage src={view.image} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="profile-identity-text">
            <h3>{view.name}</h3>
            <p>{view.email}</p>
            <Badge variant="secondary">{t('profile.identity.provider')}</Badge>
          </div>
        </div>
        <dl className="profile-facts">
          <div>
            <dt>{t('profile.identity.company')}</dt>
            <dd>{view.company}</dd>
          </div>
          <div>
            <dt>{t('profile.identity.role')}</dt>
            <dd>{t(...view.roleLabel)}</dd>
          </div>
        </dl>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              <form.AppField
                name="name"
                validators={{ onSubmit: requiredText('profile.errors.name-required') }}
              >
                {(field) => (
                  <field.InputField
                    label={t('profile.identity.name')}
                    required
                    description={t('profile.identity.name-hint')}
                    autoComplete="name"
                  />
                )}
              </form.AppField>
              <Field orientation="horizontal">
                <form.SubmitButton>{t('profile.identity.save')}</form.SubmitButton>
              </Field>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  )
}
