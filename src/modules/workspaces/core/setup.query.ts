import { authClient } from '@/modules/auth/core/auth.client'

export const setupKeys = { invitations: ['setup', 'invitations'] as const }

export const userInvitationsQuery = {
  queryKey: setupKeys.invitations,
  queryFn: () => authClient.organization.listUserInvitations(),
  meta: { silent: true },
}
