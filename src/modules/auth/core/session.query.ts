import type { DataTag, QueryClient } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { authToken } from '@/modules/auth/core/auth-token'
import { redirectPath } from '@/modules/auth/core/redirect-path'
import { errorNotice, sessionEnded } from '@/core/errors'
import { message } from '@/core/message'

export type Session = typeof authClient.$Infer.Session | null

export const sessionQuery = {
  queryKey: ['session'] as DataTag<['session'], Session>,
  queryFn: async (): Promise<Session> => {
    const session = await authClient.getSession()
    if (!session) authToken.clear()

    return session
  },
}

export async function requireSession(client: QueryClient, href: string) {
  const session = await client.ensureQueryData(sessionQuery)
  if (session) return { session, redirect: null }

  return { session: null, redirect: { to: '/login', search: { next: href } } as const }
}

export async function redirectSignedIn(
  client: QueryClient,
  { next, signedIn }: { next?: string; signedIn?: boolean }
) {
  const session = await client.ensureQueryData(sessionQuery)
  if (!session) return null

  return {
    href: redirectPath(next),
    notice: signedIn ? message('auth.notices.signed-in', { email: session.user.email }) : null,
  }
}

export function failureNotice(client: QueryClient, error: unknown, silent = false) {
  const signedIn = Boolean(client.getQueryData(sessionQuery.queryKey))
  const ended = sessionEnded(error)
  if (ended) {
    authToken.clear()
    client.setQueryData(sessionQuery.queryKey, null)
  }

  return silent && !ended ? null : errorNotice(error, signedIn)
}

export function endSession(client: QueryClient) {
  authToken.clear()
  client.clear()
  client.setQueryData(sessionQuery.queryKey, null)
}
