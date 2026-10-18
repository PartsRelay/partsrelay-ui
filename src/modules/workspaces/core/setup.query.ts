import { getGetOrganizationListUserInvitationsQueryOptions } from '@/core/api/auth/endpoints/organization/organization'

export const userInvitationsQuery = getGetOrganizationListUserInvitationsQueryOptions({
  query: { meta: { silent: true } },
})
