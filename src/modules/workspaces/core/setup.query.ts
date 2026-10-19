import { authClient } from '@/modules/auth/core/auth.client'

export const userInvitationsQuery = {
  queryKey: ['setup', 'invitations'] as const,
  queryFn: () => authClient.organization.listUserInvitations(),
  meta: { silent: true },
}
