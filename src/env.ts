import { z } from 'zod'

const schema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  API_URL: z.url().default(''),
  GOOGLE_CLIENT_ID: z.string().optional(),
})

// Empty values count as unset
const values = Object.entries(import.meta.env).filter(([, value]) => value !== '')

export const env = schema.parse(Object.fromEntries(values))
