import { QueryClient } from '@tanstack/query-core'
import { describe, expect, it, vi } from 'vite-plus/test'
import { contactsQuery } from '@/modules/contacts/core/contacts.query'
import { type LiveClient, lookupsChannel, watchLookups } from '@/modules/lookups/core/lookups.live'
import { lookupKey, lookupStatsQuery, lookupsQuery } from '@/modules/lookups/core/lookups.query'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

function fakeLive() {
  const handlers = new Set<(message: unknown) => void>()
  const listeners = new Map<string, () => void>()
  const subscription = {
    create: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    onMessage: (handler: (message: unknown) => void) => {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    get handlerCount() {
      return handlers.size
    },
  }
  const live = {
    subscription: vi.fn(() => subscription),
    on: (event: string, callback: () => void) => listeners.set(event, callback),
    off: (event: string) => listeners.delete(event),
  }

  return {
    live: live as unknown as LiveClient,
    subscription,
    send: () => handlers.forEach((handler) => handler({ changed: true })),
    emit: (event: string) => listeners.get(event)?.(),
    listeners,
  }
}

function cachedLookups() {
  const client = new QueryClient()
  const keys = [
    lookupsQuery({ page: 1 }).queryKey,
    lookupStatsQuery.queryKey,
    lookupKey(9),
    contactsQuery({ page: 1 }).queryKey,
  ]
  for (const key of keys) client.setQueryData(key, { data: [] })
  const stale = () => keys.map((key) => client.getQueryState(key)?.isInvalidated)

  return { client, stale }
}

describe('live lookups', () => {
  it('listens on the company channel of the core', () => {
    const { live, subscription } = fakeLive()

    watchLookups(new QueryClient(), live, '7')

    expect(lookupsChannel('7')).toBe('workspaces/7/lookups')
    expect(live.subscription).toHaveBeenCalledWith('workspaces/7/lookups')
    expect(subscription.create).toHaveBeenCalled()
  })

  it('reloads every cached lookup, stat and contact list when the core says lookups changed', () => {
    const { live, send } = fakeLive()
    const { client, stale } = cachedLookups()

    watchLookups(client, live, '7')
    expect(stale()).toEqual([false, false, false, false])

    send()
    expect(stale()).toEqual([true, true, true, true])
  })

  it('catches up after a dropped stream, not on the first connection', () => {
    const { live, emit } = fakeLive()
    const { client, stale } = cachedLookups()

    watchLookups(client, live, '7')
    emit('connected')
    expect(stale()).toEqual([false, false, false, false])

    emit('disconnected')
    emit('connected')
    expect(stale()).toEqual([true, true, true, true])
  })

  it('stops listening and leaves the channel when unmounted', () => {
    const { live, subscription, send, listeners } = fakeLive()
    const { client, stale } = cachedLookups()

    watchLookups(client, live, '7')()
    send()

    expect(stale()).toEqual([false, false, false, false])
    expect(listeners.size).toBe(0)
    expect(subscription.delete).toHaveBeenCalled()
  })
})
