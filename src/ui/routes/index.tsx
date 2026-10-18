import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/components/ui/button'
import { useSession } from '@/modules/ui/auth/use-session'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const { t } = useTranslation()
  const { email, signOut } = useSession()

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">PartsRelay</h1>
      <p className="text-muted-foreground">
        {email ? t('home.signedIn', { email }) : t('home.signedOut')}
      </p>
      <div className="flex gap-3">
        {email ? (
          <Button variant="outline" onClick={() => signOut.mutate()}>
            {t('home.signOut')}
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/login">{t('home.signIn')}</Link>
          </Button>
        )}
      </div>
    </main>
  )
}
