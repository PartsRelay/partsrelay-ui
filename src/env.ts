import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  shared: {
    APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  },
  client: {
    VITE_API_URL: z.url().default(''),
    VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  isServer: false,
})
