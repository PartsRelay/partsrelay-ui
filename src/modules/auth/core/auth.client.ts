import { createAuthClient } from 'better-auth/client'
import {
  inferOrgAdditionalFields,
  magicLinkClient,
  oneTapClient,
  organizationClient,
} from 'better-auth/client/plugins'
import { env } from '@/env'
import { ac, roles } from '@/modules/workspaces/core/access'

export const authClient = createAuthClient({
  baseURL: env.API_URL || window.location.origin,
  fetchOptions: { throw: true },
  plugins: [
    magicLinkClient(),
    // One Tap only starts with a client id, see startOneTap
    oneTapClient({
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      context: 'signin',
      promptOptions: { fedCM: true },
    }),
    organizationClient({
      ac,
      roles,
      schema: inferOrgAdditionalFields({
        organization: {
          additionalFields: { locale: { type: 'string', required: false, input: true } },
        },
      }),
    }),
  ],
})
