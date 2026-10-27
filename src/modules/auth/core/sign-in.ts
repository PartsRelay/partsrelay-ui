import { z } from 'zod'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'
import { authClient } from '@/modules/auth/core/auth.client'
import { message } from '@/core/message'

export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID) || mocksEnabled

const optionalString = z.string().optional().catch(undefined)

export const signInErrorSearchSchema = z.object({ error: optionalString })

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

export function googleSignIn({ back, failed, selectAccount }: SignInFlow) {
  return {
    provider: 'google',
    callbackURL: absolute(back),
    errorCallbackURL: absolute(failed),
    additionalParams: selectAccount ? { prompt: 'select_account' } : undefined,
  } satisfies Parameters<typeof authClient.signIn.social>[0]
}

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
