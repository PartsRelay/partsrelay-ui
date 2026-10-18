import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { redirectSignedIn } from '@/modules/auth/core/session.query'
import { loginError, loginFlow, loginSearchSchema } from '@/modules/auth/core/sign-in'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { SignInOptions } from '@/modules/auth/ui/sign-in-options'
import { Callout } from '@/ui/components/callout'
import { notify } from '@/ui/components/notify'
import { useT } from '@/ui/components/use-t'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/card'

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const signedIn = await redirectSignedIn(context.queryClient, search)
    if (!signedIn) return

    const { notice, href } = signedIn
    if (notice) notify('success', notice, { id: 'signed-in' })
    throw redirect({ href })
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const translateMessage = useT()
  const { next, error } = Route.useSearch()
  const failure = loginError(error)

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('login.title')}</AuthTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {failure && <Callout tone="danger">{translateMessage(failure)}</Callout>}
        <SignInOptions flow={loginFlow(next)} />
      </CardContent>
    </Card>
  )
}
