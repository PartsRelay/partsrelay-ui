import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { optimistic, type Snapshot } from '@/core/optimistic'
import { type Locale, localeNames } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKeys } from '@/modules/workspaces/core/workspace.query'

export const renameCompanyMutation = {
  mutationKey: ['company', 'rename'],
  mutationFn: (name: string) => authClient.organization.update({ data: { name } }),
  ...optimistic<Workspace, string>(workspaceKeys.all, (workspace, name) => ({
    ...workspace,
    name,
  })),
  meta: { notice: message('company.notices.renamed') },
} satisfies MutationOptions<unknown, Error, string, Snapshot<Workspace>>

export const changeLanguageMutation = {
  mutationKey: ['company', 'language'],
  mutationFn: (locale: Locale) => authClient.organization.update({ data: { locale } }),
  ...optimistic<Workspace, Locale>(workspaceKeys.all, (workspace, locale) => ({
    ...workspace,
    locale,
  })),
  meta: {
    notice: (locale: Locale) =>
      message('company.notices.language', { language: localeNames[locale] }),
  },
} satisfies MutationOptions<unknown, Error, Locale, Snapshot<Workspace>>

export function deleteCompanyMutation(workspace: Workspace) {
  return {
    mutationKey: ['company', 'delete', workspace.id],
    mutationFn: () => authClient.organization.delete({ organizationId: workspace.id }),
    onSuccess: (_data, _variables, _result, { client }) => {
      client.clear()
      client.setQueryData(sessionQuery.queryKey, null)
    },
    meta: { notice: message('company.notices.deleted') },
  } satisfies MutationOptions<unknown, Error, void>
}
