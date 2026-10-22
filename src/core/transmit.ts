import { Transmit } from '@adonisjs/transmit-client'
import { env } from '@/env'

let client: Transmit | undefined

// One live stream for the app, on the core API prefix
export function liveClient() {
  return (client ??= new Transmit({ baseUrl: `${env.API_URL || window.location.origin}/api/v1` }))
}
