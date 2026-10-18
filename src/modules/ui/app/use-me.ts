import { createContext, use } from 'react'
import type { Session } from '@/modules/core/auth/session.query'
import type { Me, Workspace } from '@/modules/core/workspace/workspace'

export type Account = { session: NonNullable<Session>; workspace: Workspace; me: Me }

export const AccountContext = createContext<Account | null>(null)

export function useMe() {
  const account = use(AccountContext)
  if (!account) throw new Error('useMe is only available inside the app shell')

  return account
}
