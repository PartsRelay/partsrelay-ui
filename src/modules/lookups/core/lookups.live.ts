import type { Transmit } from '@adonisjs/transmit-client'
import type { QueryClient } from '@tanstack/query-core'
import { getGetApiV1LookupsLookupIdQueryKey } from '@/core/api/endpoints/lookups/lookups'
import { contactsKey } from '@/modules/contacts/core/contacts.query'
import { lookupsKey } from '@/modules/lookups/core/lookups.query'

export type LiveClient = Pick<Transmit, 'subscription' | 'on' | 'off'>

export const lookupsChannel = (workspaceId: string) => `workspaces/${workspaceId}/lookups`

const [lookupPrefix] = getGetApiV1LookupsLookupIdQueryKey('')

function refreshLookups(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: lookupsKey }),
    client.invalidateQueries({ queryKey: contactsKey }),
    client.invalidateQueries({
      predicate: ({ queryKey }) => String(queryKey[0]).startsWith(lookupPrefix),
    }),
  ])
}

export function watchLookups(client: QueryClient, live: LiveClient, workspaceId: string) {
  const subscription = live.subscription(lookupsChannel(workspaceId))
  const refresh = () => void refreshLookups(client)
  let dropped = false
  const lost = () => {
    dropped = true
  }
  const back = () => {
    if (dropped) refresh()
    dropped = false
  }
  const stop = subscription.onMessage(refresh)

  live.on('disconnected', lost)
  live.on('connected', back)
  void subscription.create()

  return () => {
    stop()
    live.off('disconnected', lost)
    live.off('connected', back)
    if (subscription.handlerCount === 0) void subscription.delete()
  }
}
