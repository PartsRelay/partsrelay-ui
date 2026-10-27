import type { QueryClient } from '@tanstack/query-core'
import { z } from 'zod'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'
import { authClient } from '@/modules/auth/core/auth.client'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'

export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID) || mocksEnabled

const optionalString = z.string().optional().catch(undefined)

export const signInErrorSearchSchema = z.object({ error: optionalString })

export const callbackSearchSchema = z.object({ token: optionalString, next: optionalString })

export const loginSearchSchema = signInErrorSearchSchema.extend({
  next: optionalString,
  signedIn: z.boolean().optional().catch(undefined),
})

export type SignInFlow = { back: string; failed: string; selectAccount: boolean }

const LOGIN_ERRORS = new Map([
  ['access-denied', 'login.errors.cancelled'],
  ['invalid-token', 'errors.invalid-token'],
  ['failed-to-create-session', 'errors.failed-to-create-session'],
  ['unable-to-create-session', 'errors.failed-to-create-session'],
  ['email-not-verified', 'errors.email-not-verified'],
  ['too-many-requests', 'errors.too-many-requests'],
])

function absolute(path: string) {
  return new URL(path, window.location.origin).href
}

function coreURL(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, env.API_URL || window.location.origin)
  for (const [name, value] of Object.entries(params)) if (value) url.searchParams.set(name, value)

  return url.href
}

const handoffURL = (back: string) => coreURL('/auth/handoff', { next: back })

export function googleSignInURL({ back, failed, selectAccount }: SignInFlow) {
  if (mocksEnabled) return `/auth/callback?${new URLSearchParams({ token: 'mock', next: back })}`

  return coreURL('/auth/google', {
    callbackURL: handoffURL(back),
    errorCallbackURL: absolute(failed),
    prompt: selectAccount ? 'select_account' : undefined,
  })
}

const encodedAgain = (url: string) => url.replaceAll('%', '%25')

export function magicLinkSignIn({ back, failed }: SignInFlow, email: string) {
  return {
    email,
    callbackURL: encodedAgain(handoffURL(back)),
    errorCallbackURL: encodedAgain(absolute(failed)),
  } satisfies Parameters<typeof authClient.signIn.magicLink>[0]
}

export async function completeSignIn(
  client: QueryClient,
  { token, next }: z.infer<typeof callbackSearchSchema>
) {
  const back = new URL(redirectPath(next), window.location.origin)
  const verified = token ? await authClient.oneTimeToken.verify({ token }).catch(() => null) : null

  if (verified) await client.resetQueries({ queryKey: sessionQuery.queryKey })
  else back.searchParams.set('error', 'invalid-token')

  return `${back.pathname}${back.search}${back.hash}`
}

function withoutSignInError(href: string) {
  const url = new URL(href, window.location.origin)
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')

  return `${url.pathname}${url.search}${url.hash}`
}

export function invitationFlow(href: string): SignInFlow {
  const back = withoutSignInError(href)

  return { back, failed: back, selectAccount: true }
}

export function loginError(error: string | undefined) {
  if (!error) return null

  return message(LOGIN_ERRORS.get(error) ?? 'login.errors.failed')
}
