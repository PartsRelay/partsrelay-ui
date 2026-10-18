import { env } from '@/env'
import { configureHttp } from '@/core/http/client'

export function bootstrapCore() {
  configureHttp(env.VITE_API_URL)
}
