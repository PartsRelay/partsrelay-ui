import type { MutationOptions } from '@tanstack/query-core'
import {
  postOrganizationDelete,
  postOrganizationUpdate,
} from '@/core/api/auth/endpoints/organization/organization'
import { message } from '@/core/message'
import { optimistic, type Snapshot } from '@/core/optimistic'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { type Locale, localeNames } from '@/modules/workspaces/core/locale'
import type { FullOrganization, Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

export const renameCompanyMutation = {
  mutationKey: ['company', 'rename'],
  mutationFn: (name: string) => postOrganizationUpdate({ data: { name } }),
  ...optimistic<FullOrganization, string>(workspaceKey, (organization, name) => ({
    ...organization,
    name,
  })),
  meta: { notice: message('company.notices.renamed') },
} satisfies MutationOptions<unknown, Error, string, Snapshot<FullOrganization>>

export const changeLanguageMutation = {
  mutationKey: ['company', 'language'],
  mutationFn: (locale: Locale) => postOrganizationUpdate({ data: { locale } }),
  ...optimistic<FullOrganization, Locale>(workspaceKey, (organization, locale) => ({
    ...organization,
    locale,
  })),
  meta: {
    notice: (locale: Locale) =>
      message('company.notices.language', { language: localeNames[locale] }),
  },
} satisfies MutationOptions<unknown, Error, Locale, Snapshot<FullOrganization>>

export function deleteCompanyMutation(workspace: Workspace) {
  return {
    mutationKey: ['company', 'delete', workspace.id],
    mutationFn: () => postOrganizationDelete({ organizationId: workspace.id }),
    onSuccess: (_data, _variables, _result, { client }) => {
      client.clear()
      client.setQueryData(sessionQuery.queryKey, null)
    },
    meta: { notice: message('company.notices.deleted') },
  } satisfies MutationOptions<unknown, Error, void>
}
