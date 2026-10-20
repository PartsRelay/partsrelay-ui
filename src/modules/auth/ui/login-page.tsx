import type { QueryClient } from '@tanstack/query-core'
import { getRouteApi, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { redirectSignedIn } from '@/modules/auth/core/session.query'
import { loginError, loginFlow, type loginSearchSchema } from '@/modules/auth/core/sign-in'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { SignInOptions } from '@/modules/auth/ui/sign-in-options'
import { Callout } from '@/ui/components/callout'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { notify } from '@/ui/components/notify'

const route = getRouteApi('/(auth)/login')

type LoginGuard = {
  context: { queryClient: QueryClient }
  search: z.infer<typeof loginSearchSchema>
}

export async function redirectIfSignedIn({ context, search }: LoginGuard) {
  const signedIn = await redirectSignedIn(context.queryClient, search)
  if (!signedIn) return

  const { notice, href } = signedIn
  if (notice) notify('success', notice, { id: 'signed-in' })
  throw redirect({ href })
}

export function LoginPage() {
  const { t } = useTranslation()
  const { next, error } = route.useSearch()
  const failure = loginError(error)

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('login.title')}</AuthTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {failure && <Callout tone="danger">{t(...failure)}</Callout>}
        <SignInOptions flow={loginFlow(next)} />
      </CardContent>
    </Card>
  )
}
