import { createAuthClient } from 'better-auth/client'
import { inferOrgAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { env } from '@/core/config/env'
import { ac, roles } from '@/modules/core/workspace/access'

export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL || window.location.origin,
  fetchOptions: { throw: true },
  plugins: [
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
