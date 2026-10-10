import { env } from '@/core/config/env'
import { configureHttp } from '@/core/http/client'
import { session } from '@/modules/core/auth/session.store'

export function bootstrapCore() {
  configureHttp({
    baseUrl: env.VITE_API_URL,
    getToken: session.getToken,
    onUnauthorized: session.signOut,
  })
}
