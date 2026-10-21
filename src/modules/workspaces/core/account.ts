import { hashKey, type QueryClient } from '@tanstack/query-core'
import { type Session, sessionQuery } from '@/modules/auth/core/session.query'
import { findMe, toWorkspace, type Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceQuery } from '@/modules/workspaces/core/workspace.query'

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
