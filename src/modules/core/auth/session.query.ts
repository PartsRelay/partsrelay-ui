import type { QueryClient } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { redirectPath } from '@/modules/core/auth/redirect-path'
import { errorNotice, sessionEnded } from '@/modules/core/shared/errors'
import { message } from '@/modules/core/shared/message'

export type Session = Awaited<ReturnType<typeof authClient.getSession>> | null

export const sessionQuery = {
  queryKey: ['session'] as const,
  queryFn: (): Promise<Session> => authClient.getSession(),
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
    notice: signedIn ? message('auth.notices.signedIn', { email: session.user.email }) : null,
  }
}

export function failureNotice(client: QueryClient, error: unknown, silent = false) {
  const signedIn = Boolean(client.getQueryData(sessionQuery.queryKey))
  if (sessionEnded(error)) client.setQueryData(sessionQuery.queryKey, null)

  return silent ? null : errorNotice(error, signedIn)
}
