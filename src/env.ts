import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export function readEnv(source: Record<string, string | undefined>) {
  return createEnv({
    server: {
      APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
      APP_NAME: z.string().default('Parts Relay'),
      API_URL: z.url().default(''),
      GOOGLE_CLIENT_ID: z.string().optional(),
      SUPPORT_URL: z.url().optional(),
      PRIVACY_URL: z.url().optional(),
      TERMS_URL: z.url().optional(),
    },
    runtimeEnv: source,
    emptyStringAsUndefined: true,
    isServer: true,
  })
}

export type Env = ReturnType<typeof readEnv>

declare const __ENV__: Env

export const env = typeof __ENV__ === 'undefined' ? ({} as Env) : __ENV__
