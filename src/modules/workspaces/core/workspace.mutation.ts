import type { QueryClient } from '@tanstack/query-core'
import { optimistic } from '@/core/optimistic'
import { authClient } from '@/modules/auth/core/auth.client'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

type CompanyChange = Partial<Pick<FullOrganization, 'name' | 'locale'>>

export function updateCompany(client: QueryClient, change: CompanyChange) {
  return optimistic<FullOrganization>(
    client,
    workspaceKey,
    (organization) => ({ ...organization, ...change }),
    () => authClient.organization.update({ data: change })
  )
}
