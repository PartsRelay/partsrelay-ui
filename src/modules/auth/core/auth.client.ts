import { createAuthClient } from 'better-auth/client'
import {
  inferOrgAdditionalFields,
  magicLinkClient,
  oneTapClient,
  organizationClient,
} from 'better-auth/client/plugins'
import { env } from '@/env'
import { i18n } from '@/i18n'
import { ac, roles } from '@/modules/workspaces/core/access'

export const authClient = createAuthClient({
  baseURL: env.API_URL || (typeof window === 'undefined' ? undefined : window.location.origin),
  fetchOptions: {
    throw: true,
    credentials: 'include',
    // The core answers in the app language
    onRequest: (context) => {
      context.headers.set('Accept-Language', i18n.language)
    },
  },
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
