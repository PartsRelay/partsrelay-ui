import { z } from 'zod'
import { authClient } from '@/modules/auth/core/auth.client'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import { message } from '@/core/message'

const optionalString = z.string().optional().catch(undefined)

export const signInErrorSearchSchema = z.object({ error: optionalString })

export const loginSearchSchema = signInErrorSearchSchema.extend({
  next: optionalString,
  signedIn: z.boolean().optional().catch(undefined),
})

// Where the browser lands after signing in or failing
export type SignInFlow = { back: string; failed: string; selectAccount: boolean }

const LOGIN_ERRORS = new Map([
  ['access_denied', 'login.errors.cancelled'],
  ['INVALID_TOKEN', 'errors.invalid-token'],
  ['failed_to_create_session', 'errors.failed-to-create-session'],
  ['email_not_verified', 'errors.email-not-verified'],
])

function absolute(path: string) {
  return new URL(path, window.location.origin).href
}

function loginPath(next: string, signedIn = false) {
  const search = new URLSearchParams()
  if (next !== '/') search.set('next', next)
  if (signedIn) search.set('signedIn', 'true')

  return search.size ? `/login?${search}` : '/login'
}

export function googleSignIn({ back, failed, selectAccount }: SignInFlow) {
  return {
    provider: 'google',
    callbackURL: absolute(back),
    errorCallbackURL: absolute(failed),
    additionalParams: selectAccount ? { prompt: 'select_account' } : undefined,
  } satisfies Parameters<typeof authClient.signIn.social>[0]
}

// The core decodes magic link URLs once more
function encodedAgain(path: string) {
  return absolute(path).replaceAll('%', '%25')
}

export function magicLinkSignIn({ back, failed }: SignInFlow, email: string) {
  return {
    email,
    callbackURL: encodedAgain(back),
    errorCallbackURL: encodedAgain(failed),
  } satisfies Parameters<typeof authClient.signIn.magicLink>[0]
}

export function loginFlow(next?: unknown): SignInFlow {
  const target = redirectPath(next)

  return { back: loginPath(target, true), failed: loginPath(target), selectAccount: false }
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
