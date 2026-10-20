import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

// Validates the whole environment when Vite starts
export function readEnv(source: Record<string, string | undefined>) {
  return createEnv({
    server: {
      APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
      API_URL: z.url().default(''),
      GOOGLE_CLIENT_ID: z.string().optional(),
    },
    runtimeEnv: source,
    emptyStringAsUndefined: true,
    isServer: true,
  })
}

export type Env = ReturnType<typeof readEnv>

declare const __ENV__: Env

// Vite inlines only the validated variables, see vite.config.ts
export const env = typeof __ENV__ === 'undefined' ? ({} as Env) : __ENV__
