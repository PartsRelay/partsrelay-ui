import { env } from '@/core/config/env'
import { configureHttp } from '@/core/http/client'

export function bootstrapCore() {
  configureHttp(env.VITE_API_URL)
}
