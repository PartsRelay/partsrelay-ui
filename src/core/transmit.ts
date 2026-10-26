import { Transmit } from '@adonisjs/transmit-client'
import { errorMessage } from '@/core/errors'
import { notify } from '@/core/notify'
import { env } from '@/env'

let client: Transmit | undefined

// One live stream for the app, on the core API prefix
export function liveClient() {
  return (client ??= new Transmit({
    baseUrl: `${env.API_URL || window.location.origin}/api/v1`,
    onSubscribeFailed: (response) => notify('danger', ...errorMessage(response)),
  }))
}
