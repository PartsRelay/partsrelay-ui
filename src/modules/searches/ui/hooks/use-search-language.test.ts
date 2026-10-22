import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { searchKeys } from '@/modules/searches/core/searches.query'
import { useSearchLanguage } from '@/modules/searches/ui/hooks/use-search-language'

const harness = vi.hoisted(() => ({
  effect: undefined as (() => void | (() => void)) | undefined,
  client: undefined as QueryClient | undefined,
  listeners: new Set<() => void>(),
}))
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useEffect: (effect: () => void | (() => void)) => {
    harness.effect = effect
  },
}))
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => harness.client,
}))
vi.mock('@/i18n', () => ({
  i18n: {
    on: (_event: string, handler: () => void) => {
      harness.listeners.add(handler)
    },
    off: (_event: string, handler: () => void) => {
      harness.listeners.delete(handler)
    },
  },
}))
vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

let client: QueryClient
let cleanup: (() => void) | undefined
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  harness.client = client
  useSearchLanguage('company-a')
  cleanup = harness.effect?.() || undefined
})
afterEach(() => {
  cleanup?.()
  harness.listeners.clear()
  client.clear()
})
async function languageChanged() {
  for (const listener of harness.listeners) listener()
  await Promise.resolve()
  await Promise.resolve()
}

describe('localized search data', () => {
  it('marks only the current company search data stale when personal language changes', async () => {
    const current = searchKeys.detail('company-a', 17)
    const other = searchKeys.detail('company-b', 17)
    const company = ['workspace']
    const contacts = ['workspaces', 'company-a', 'contacts']
    for (const key of [current, other, company, contacts])
      client.setQueryData(key, { language: 'en' })
    expect(client.getQueryState(current)?.isInvalidated).toBe(false)
    await languageChanged()
    await vi.waitFor(() => expect(client.getQueryState(current)?.isInvalidated).toBe(true))
    for (const key of [other, company, contacts])
      expect(client.getQueryState(key)?.isInvalidated).toBe(false)
    expect(client.getQueryData(company)).toEqual({ language: 'en' })
  })

  it('cancels an older-language response before it can overwrite the cache', async () => {
    const key = searchKeys.detail('company-a', 17)
    let resolve: (value: string) => void = () => undefined
    let signal: AbortSignal | undefined
    const pending = client
      .fetchQuery({
        queryKey: key,
        queryFn: (context) => {
          signal = context.signal
          return new Promise<string>((done) => {
            resolve = done
          })
        },
      })
      .catch(() => undefined)
    await languageChanged()
    expect(signal?.aborted).toBe(true)
    resolve('Old English result')
    await pending
    expect(client.getQueryData(key)).toBeUndefined()
  })

  it('removes its language listener when the company shell is unmounted', async () => {
    const key = searchKeys.detail('company-a', 17)
    client.setQueryData(key, { language: 'en' })
    cleanup?.()
    expect(harness.listeners.size).toBe(0)
    await languageChanged()
    expect(client.getQueryState(key)?.isInvalidated).toBe(false)
  })
})
