import type { MutationOptions } from '@tanstack/query-core'
import { z } from 'zod'
import { socialSignIn } from '@/core/api/auth/endpoints/default/default'
import { signInWithMagicLink } from '@/core/api/auth/endpoints/magic-link/magic-link'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import { message } from '@/core/message'

const optionalString = z.string().optional().catch(undefined)

export const signInErrorSearchSchema = z.object({ error: optionalString })

export const loginSearchSchema = signInErrorSearchSchema.extend({
  next: optionalString,
  signedIn: z.boolean().optional().catch(undefined),
})

export type SignInFlow = {
  google: MutationOptions<unknown, Error, void>
  magicLink: MutationOptions<unknown, Error, string>
  afterSignIn: string
}

const LOGIN_ERRORS = new Map([
  ['access_denied', 'login.errors.cancelled'],
  ['INVALID_TOKEN', 'errors.INVALID_TOKEN'],
  ['failed_to_create_session', 'errors.failed_to_create_session'],
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

export function signInMutation(back: string, failed: string, selectAccount = false) {
  return {
    mutationKey: ['sign-in', 'google'],
    mutationFn: async () => {
      const { url } = await socialSignIn({
        provider: 'google',
        callbackURL: absolute(back),
        errorCallbackURL: absolute(failed),
        disableRedirect: true,
        additionalParams: selectAccount ? { prompt: 'select_account' } : undefined,
      })
      if (url) window.location.assign(url)
    },
  } satisfies MutationOptions<unknown, Error, void>
}

export function magicLinkMutation(back: string, failed: string) {
  return {
    mutationKey: ['sign-in', 'magic-link'],
    mutationFn: (email: string) =>
      signInWithMagicLink({
        email,
        callbackURL: absolute(back),
        errorCallbackURL: absolute(failed),
      }),
    meta: { silent: true },
  } satisfies MutationOptions<unknown, Error, string>
}

export function loginFlow(next?: unknown): SignInFlow {
  const target = redirectPath(next)
  const back = loginPath(target, true)
  const failed = loginPath(target)

  return {
    google: signInMutation(back, failed),
    magicLink: magicLinkMutation(back, failed),
    afterSignIn: back,
  }
}

function withoutSignInError(href: string) {
  const url = new URL(href, window.location.origin)
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')

  return `${url.pathname}${url.search}${url.hash}`
}

export function invitationFlow(href: string): SignInFlow {
  const back = withoutSignInError(href)

  return {
    google: signInMutation(back, back, true),
    magicLink: magicLinkMutation(back, back),
    afterSignIn: back,
  }
}

export function loginError(error: string | undefined) {
  if (!error) return null

  return message(LOGIN_ERRORS.get(error) ?? 'login.errors.failed')
}
