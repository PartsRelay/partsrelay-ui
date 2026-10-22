import { useTranslation } from 'react-i18next'
import { useAppForm } from '@/form'
import { profileView } from '@/modules/auth/core/profile'
import { IdentityCard } from '@/modules/auth/ui/identity-card'
import { LeaveCompanyCard } from '@/modules/auth/ui/leave-company-card'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'
import { toLocale } from '@/modules/workspaces/core/locale'
import { LocaleSelect } from '@/modules/workspaces/ui/locale-select'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { notify } from '@/core/notify'
import { PageHeader } from '@/ui/components/page-header'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import '@/modules/workspaces/ui/workspace-pages.css'

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { session, workspace, me } = useMe()
  const view = profileView(me, workspace)

  return (
    <div className="workspace-page page-stack">
      <div className="workspace-page-heading">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <PageHeader title={t('profile.title')} description={t('profile.description')} />
      </div>
      <div className="profile-grid">
        <div className="profile-main">
          <IdentityCard view={view} userName={session.user.name} />
          <PreferencesCard key={i18n.resolvedLanguage} />
          <SessionCard />
        </div>
        <LeaveCompanyCard view={view} workspace={workspace} />
      </div>
    </div>
  )
}

function PreferencesCard() {
  const { t, i18n } = useTranslation()
  const form = useAppForm({
    defaultValues: { locale: toLocale(i18n.resolvedLanguage) },
    onSubmit: async ({ value }) => {
      try {
        localStorage.setItem('partsrelay.language', value.locale)
        await i18n.changeLanguage(value.locale)
        notify('success', 'profile.notices.language-saved')
      } catch {
        notify('danger', 'profile.preferences.save-error')
      }
    },
  })

  return (
    <Card className="workspace-card">
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.preferences.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className="workspace-inline-form">
            <form.AppField name="locale">
              {(field) => (
                <LocaleSelect
                  label={t('profile.preferences.language')}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              )}
            </form.AppField>
            <form.SubmitButton>{t('profile.preferences.save')}</form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  )
}

function SessionCard() {
  const { t } = useTranslation()
  const { pending, signOut } = useSignOut()
  return (
    <Card className="workspace-card">
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.session.title')}</h2>
        </CardTitle>
        <CardDescription>{t('profile.session.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" disabled={pending} onClick={() => void signOut()}>
          {t('profile.session.action')}
        </Button>
      </CardContent>
    </Card>
  )
}
