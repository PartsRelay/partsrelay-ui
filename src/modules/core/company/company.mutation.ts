import type { MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { message } from '@/modules/core/shared/message'
import { optimistic, type Snapshot } from '@/modules/core/shared/optimistic'
import { type Locale, localeNames } from '@/modules/core/workspace/locale'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

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
