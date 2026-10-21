import { createContext, use } from 'react'
import type { Session } from '@/modules/auth/core/session.query'
import type { Me, Workspace } from '@/modules/workspaces/core/workspace'

export type Account = { session: NonNullable<Session>; workspace: Workspace; me: Me }

export const AccountContext = createContext<Account | null>(null)

export function useMe() {
  const account = use(AccountContext)
  if (!account) throw new Error('useMe is only available inside the app shell')

  return account
}
