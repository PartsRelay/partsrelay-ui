import type { QueryClient } from '@tanstack/query-core'
import { getRouteApi, redirect, useRouter } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { env } from '@/env'
import { notify } from '@/core/notify'
import { redirectSignedIn } from '@/modules/auth/core/session.query'
import { loginError, type loginSearchSchema } from '@/modules/auth/core/sign-in'
import { AuthTitle } from '@/ui/components/auth-title'
import { SignInOptions } from '@/modules/auth/ui/sign-in-options'
import { Callout } from '@/ui/components/callout'
import { ExternalLink } from '@/ui/components/external-link'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

const route = getRouteApi('/(auth)/login')

type LoginGuard = {
  context: { queryClient: QueryClient }
  search: z.infer<typeof loginSearchSchema>
}

export async function redirectIfSignedIn({ context, search }: LoginGuard) {
  const signedIn = await redirectSignedIn(context.queryClient, search)
  if (!signedIn) return

  const { notice, href } = signedIn
  if (notice) notify('success', ...notice)
  throw redirect({ href })
}

export function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { next, error } = route.useSearch()
  const failure = loginError(error)
  const login = (signedIn?: true) =>
    router.buildLocation({ to: '/login', search: { next, signedIn } }).href

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('login.title')}</AuthTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {failure && <Callout tone="danger">{t(...failure)}</Callout>}
        <SignInOptions flow={{ back: login(true), failed: login(), selectAccount: false }} />
        {env.TERMS_URL && env.PRIVACY_URL && (
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="login.legal.consent"
              components={{
                terms: <ExternalLink href={env.TERMS_URL} className="underline" />,
                privacy: <ExternalLink href={env.PRIVACY_URL} className="underline" />,
              }}
            />
          </p>
        )}
        {env.SUPPORT_URL && (
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="login.legal.support"
              components={{
                support: <ExternalLink href={env.SUPPORT_URL} className="underline" />,
              }}
            />
          </p>
        )}
      </CardContent>
    </Card>
  )
}
