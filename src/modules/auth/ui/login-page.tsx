import type { QueryClient } from '@tanstack/query-core'
import { getRouteApi, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { env } from '@/env'
import { redirectSignedIn } from '@/modules/auth/core/session.query'
import { loginError, loginFlow, type loginSearchSchema } from '@/modules/auth/core/sign-in'
import { GoogleLogin } from '@/modules/auth/ui/google-login'
import { useOneTap } from '@/modules/auth/ui/hooks/use-one-tap'
import { Callout } from '@/ui/components/callout'
import { Badge } from '@/ui/components/ui/badge'
import { notify } from '@/core/notify'

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
  const { next, error } = route.useSearch()
  const failure = loginError(error)
  const flow = loginFlow(next)
  useOneTap(flow.back)

  return (
    <main className="login-layout">
      <section className="login-intro" aria-labelledby="login-promise-heading">
        <img
          className="login-logo"
          src="/brand/logo-light.png"
          alt={env.APP_NAME}
          width="220"
          height="52"
        />
        <div className="login-promise">
          <p className="eyebrow">{t('design.login.eyebrow')}</p>
          <h1 id="login-promise-heading">
            {t('design.login.headline1')}
            <br />
            {t('design.login.headline2')}
          </h1>
          <p>{t('design.login.description')}</p>
          <div className="dispatch-preview">
            <div className="dispatch-label">
              <span>{t('design.login.request')}</span>
              <span>{t('design.login.route')}</span>
            </div>
            <div className="dispatch-request">
              <strong>GH482KL</strong>
              <span>{t('design.login.part')}</span>
            </div>
            <div className="dispatch-match">
              <span className="dispatch-stage">{t('design.login.match')}</span>
              <strong>
                {t('design.login.sample-vehicle')} <span className="dispatch-year">/ 2019</span>
              </strong>
              <span>{t('design.login.sample-reference')}</span>
              <small>{t('design.login.sample-aftermarket')}</small>
            </div>
            <div className="info-banner">
              <img src="/brand/info.svg" alt="" width="16" height="16" />
              <p>{t('design.login.demo')}</p>
            </div>
          </div>
        </div>
        <div className="login-channel">
          <img src="/brand/messages.svg" alt="" width="20" height="20" />
          <p>
            {t('design.login.channel')}
            <br />
            {t('design.login.channel2')}
          </p>
        </div>
      </section>
      <section className="login-surface" aria-labelledby="login-welcome-heading">
        <Badge variant="secondary" className="login-audience">
          {t('design.login.audience')}
        </Badge>
        <div className="login-content">
          <div className="login-welcome">
            <h2 id="login-welcome-heading">
              {t('design.login.welcome1')}
              <br />
              {t('design.login.welcome2')}
            </h2>
            <p>
              {t(
                env.LOCAL_REVIEW_AUTH
                  ? 'login.local-review.instructions'
                  : 'design.login.instructions'
              )}
            </p>
          </div>
          {failure && <Callout tone="danger">{t(...failure)}</Callout>}
          <GoogleLogin flow={flow} />
          <aside className="login-guidance">
            <h3>
              {t(env.LOCAL_REVIEW_AUTH ? 'login.local-review.title' : 'design.login.new-title')}
            </h3>
            <p>
              {t(
                env.LOCAL_REVIEW_AUTH ? 'login.local-review.description' : 'design.login.new-body'
              )}
            </p>
          </aside>
          <p className="login-security-note">
            {t(env.LOCAL_REVIEW_AUTH ? 'login.local-review.pending' : 'design.login.secure')}
          </p>
        </div>
        <footer className="login-footer">
          <span>{t('design.login.footer')}</span>
          <span>{t('design.login.tagline')}</span>
        </footer>
      </section>
    </main>
  )
}
