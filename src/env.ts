import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

type EnvironmentOptions = { mode?: string; isBuild?: boolean }

// Only this public allowlist is included in the browser bundle.
export function readEnv(
  source: Record<string, string | undefined>,
  { mode = 'development', isBuild = false }: EnvironmentOptions = {}
) {
  const environment = createEnv({
    server: {
      APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
      APP_NAME: z.string().trim().min(1).default('PartsRelay'),
      API_URL: z
        .union([
          z.literal(''),
          z.url().refine((value) => {
            const url = new URL(value)
            return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
          }, 'The API URL must be an HTTP(S) URL without credentials'),
        ])
        .default(''),
      GOOGLE_CLIENT_ID: z.string().optional(),
      API_MOCKS: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
      LOCAL_REVIEW_AUTH: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    },
    runtimeEnv: {
      APP_ENV: source.APP_ENV ?? (mode === 'production' ? 'production' : 'development'),
      APP_NAME: source.APP_NAME,
      API_URL: source.VITE_API_URL ?? source.API_URL,
      GOOGLE_CLIENT_ID: source.VITE_GOOGLE_CLIENT_ID ?? source.GOOGLE_CLIENT_ID,
      API_MOCKS: source.VITE_API_MOCKS,
      LOCAL_REVIEW_AUTH: source.VITE_LOCAL_REVIEW_AUTH,
    },
    emptyStringAsUndefined: true,
    isServer: true,
  })

  if (
    environment.LOCAL_REVIEW_AUTH &&
    (isBuild ||
      mode !== 'development' ||
      environment.APP_ENV !== 'development' ||
      environment.API_MOCKS ||
      environment.API_URL !== 'http://localhost:3335')
  ) {
    throw new Error(
      'Local review authentication requires development mode, APP_ENV=development, API_URL=http://localhost:3335 and API mocks disabled. It cannot be included in a build.'
    )
  }

  if (environment.API_MOCKS && (isBuild || environment.APP_ENV === 'production')) {
    throw new Error('API mocks are only allowed in an explicitly enabled local development session')
  }
  return environment
}

export type Env = ReturnType<typeof readEnv>

declare const __ENV__: Env

// Vite inlines only the validated variables, see vite.config.ts
export const env = typeof __ENV__ === 'undefined' ? readEnv({}) : __ENV__
