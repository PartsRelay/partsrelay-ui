import { hashKey, type QueryClient } from '@tanstack/query-core'
import { type Session, sessionQuery } from '@/modules/auth/core/session.query'
import type { Locale } from '@/modules/workspaces/core/locale'
import { findMe, toWorkspace, type Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey, workspaceQuery } from '@/modules/workspaces/core/workspace.query'

function accountIn(workspace: Workspace, userId: string) {
  const me = findMe(workspace, userId)

  return me && { workspace, me }
}

export async function loadAccount(client: QueryClient, userId: string) {
  const cached = await client.ensureQueryData({ ...workspaceQuery, revalidateIfStale: true })
  const account =
    accountIn(toWorkspace(cached), userId) ??
    accountIn(toWorkspace(await client.fetchQuery({ ...workspaceQuery, staleTime: 0 })), userId)
  if (!account) throw new Error('Missing membership')

  return account
}

export function watchAccount(client: QueryClient, onChange: () => void) {
  const sessionHash = hashKey(sessionQuery.queryKey)
  const userId = () => client.getQueryData<Session>(sessionQuery.queryKey)?.user.id ?? null
  let current = userId()

  return client.getQueryCache().subscribe(({ query }) => {
    if (query.queryHash !== sessionHash) return

    const next = userId()
    if (current && next && next !== current) onChange()
    current = next ?? current
  })
}

export function companyLocale(client: QueryClient): Locale | null {
  const session = client.getQueryData<Session>(sessionQuery.queryKey)
  const organization = client.getQueryData(workspaceKey)
  const workspace = organization && toWorkspace(organization)
  // A pending setup keeps the browser language
  if (!session || !workspace || workspace.setup === 'pending') return null

  return workspace.locale
}

export function watchCompanyLocale(client: QueryClient, onChange: (locale: Locale | null) => void) {
  const watched = [hashKey(sessionQuery.queryKey), hashKey(workspaceKey)]
  let current = companyLocale(client)

  return client.getQueryCache().subscribe(({ query }) => {
    if (!watched.includes(query.queryHash)) return

    const next = companyLocale(client)
    if (next === current) return

    current = next
    onChange(next)
  })
}
