import { isAfter } from 'date-fns'
import { requiredText } from '@/core/schemas'
import type { Locale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'

type UserInvitation = {
  id: string
  organizationName: string
  status: string
  expiresAt: Date | string
}

export type SetupValues = { name: string; locale: Locale; userName: string }

export function pendingInvitation(invitations: UserInvitation[] | undefined, now: Date) {
  return (
    invitations?.find(
      (invitation) => invitation.status === 'pending' && isAfter(invitation.expiresAt, now)
    ) ?? null
  )
}

export function setupDefaults(
  workspace: Pick<Workspace, 'name' | 'locale' | 'setup'>,
  browserLocale: Locale
): SetupValues {
  const pending = workspace.setup === 'pending'

  return {
    name: pending ? '' : workspace.name,
    locale: pending ? browserLocale : workspace.locale,
    userName: '',
  }
}

export const setupSchemas = {
  name: requiredText('setup.errors.name-required'),
  userName: requiredText('setup.errors.user-name-required'),
}
