import type { DataTag, QueryClient, QueryFunctionContext } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import { errorNotice, errorStatus, sessionEnded } from '@/core/errors'
import { message } from '@/core/message'

export type Session = typeof authClient.$Infer.Session | null

export const sessionQuery = {
  queryKey: ['session'] as DataTag<['session'], Session>,
  queryFn: ({ signal }: QueryFunctionContext): Promise<Session> =>
    authClient.getSession({ query: { disableCookieCache: true }, fetchOptions: { signal } }),
  retry: false,
}

async function verifiedSession(client: QueryClient) {
  try {
    const session = await client.fetchQuery({ ...sessionQuery, staleTime: 0 })
    if (!session) endSession(client)
    return session
  } catch (error) {
    if (errorStatus(error) !== 401) throw error
    endSession(client)
    return null
  }
}

export async function requireSession(client: QueryClient, href: string) {
  const session = await verifiedSession(client)
  if (session) return { session, redirect: null }

  return {
    session: null,
    redirect: { to: '/login', search: { next: redirectPath(href) } } as const,
  }
}

export async function redirectSignedIn(
  client: QueryClient,
  { next, signedIn }: { next?: string; signedIn?: boolean }
) {
  const session = await verifiedSession(client)
  if (!session) return null

  return {
    href: redirectPath(next),
    notice: signedIn ? message('auth.notices.signed-in', { email: session.user.email }) : null,
  }
}

export function failureNotice(client: QueryClient, error: unknown, silent = false) {
  const signedIn = Boolean(client.getQueryData(sessionQuery.queryKey))
  if (sessionEnded(error)) endSession(client)

  return silent ? null : errorNotice(error, signedIn)
}

// The session is over: nothing cached belongs to anyone now
export function endSession(client: QueryClient) {
  client.clear()
  client.setQueryData(sessionQuery.queryKey, null)
}
