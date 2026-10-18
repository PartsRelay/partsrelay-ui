import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.url().default(''),
    VITE_API_MOCKS: z.enum(['true', 'false']).default('true'),
    VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  isServer: false,
})
