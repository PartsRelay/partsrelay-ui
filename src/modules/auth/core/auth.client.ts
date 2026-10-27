import { createAuthClient } from 'better-auth/client'
import {
  inferOrgAdditionalFields,
  magicLinkClient,
  oneTapClient,
  oneTimeTokenClient,
  organizationClient,
} from 'better-auth/client/plugins'
import { env } from '@/env'
import { i18n } from '@/i18n'
import { authToken } from '@/modules/auth/core/auth-token'
import { ac, roles } from '@/modules/workspaces/core/access'

export const authClient = createAuthClient({
  baseURL: env.API_URL || window.location.origin,
  fetchOptions: {
    throw: true,
    credentials: 'omit',
    auth: { type: 'Bearer', token: authToken.read },
    onRequest: (context) => {
      context.headers.set('Accept-Language', i18n.language)
    },
    onSuccess: ({ response }) => {
      const token = response.headers.get('set-auth-token')
      if (token) authToken.save(token)
    },
  },
  plugins: [
    magicLinkClient(),
    oneTimeTokenClient(),
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
