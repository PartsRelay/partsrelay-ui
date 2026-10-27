import { Transmit } from '@adonisjs/transmit-client'
import { errorMessage } from '@/core/errors'
import { notify } from '@/core/notify'
import { env } from '@/env'
import { authToken } from '@/modules/auth/core/auth-token'

let client: Transmit | undefined

const authorize = (request: Request) => {
  const header = authToken.header()
  if (header) request.headers.set('Authorization', header)
}

export function liveClient() {
  return (client ??= new Transmit({
    baseUrl: `${env.API_URL || window.location.origin}/api/v1`,
    beforeSubscribe: authorize,
    beforeUnsubscribe: authorize,
    onSubscribeFailed: (response) => notify('danger', ...errorMessage(response)),
  }))
}
