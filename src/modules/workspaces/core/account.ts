import { hashKey, type QueryClient } from '@tanstack/query-core'
import { errorStatus } from '@/core/errors'
import { type Session, sessionQuery } from '@/modules/auth/core/session.query'
import { findMe, toWorkspace, type Workspace } from '@/modules/workspaces/core/workspace'
import { WorkspaceAccessError, workspaceQuery } from '@/modules/workspaces/core/workspace.query'

function accountIn(workspace: Workspace, userId: string) {
  const me = findMe(workspace, userId)

  return me && { workspace, me }
}

export async function loadAccount(client: QueryClient, userId: string) {
  try {
    const organization = await client.fetchQuery({ ...workspaceQuery, staleTime: 0 })
    const account = accountIn(toWorkspace(organization), userId)
    if (!account) throw new WorkspaceAccessError()
    return account
  } catch (error) {
    // Core may return 404 when a previously valid membership has been removed.
    if ([403, 404].includes(errorStatus(error))) clearPrivateQueries(client)
    throw error
  }
}

function clearPrivateQueries(client: QueryClient) {
  const sessionHash = hashKey(sessionQuery.queryKey)
  client.removeQueries({ predicate: (query) => query.queryHash !== sessionHash })
  client.getMutationCache().clear()
}

export function watchAccount(client: QueryClient, onChange: () => void) {
  const sessionHash = hashKey(sessionQuery.queryKey)
  const identity = () => {
    const session = client.getQueryData<Session>(sessionQuery.queryKey)
    return session ? `${session.user.id}:${session.session.activeOrganizationId ?? ''}` : null
  }
  let current = identity()

  return client.getQueryCache().subscribe((event) => {
    if (
      event.query.queryHash !== sessionHash ||
      event.type !== 'updated' ||
      event.action.type !== 'success'
    )
      return

    const next = identity()
    const changed = current !== null && next !== current
    current = next
    if (!changed) return
    clearPrivateQueries(client)
    onChange()
  })
}
