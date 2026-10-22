import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useSearchStream } from '@/modules/searches/ui/hooks/use-search-stream'

const harness = vi.hoisted(() => ({
  effect: undefined as (() => void | (() => void)) | undefined,
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useEffect: (effect: () => void | (() => void)) => {
    harness.effect = effect
  },
}))
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries: harness.invalidateQueries }),
}))
vi.mock('@/env', () => ({ env: { API_URL: 'http://localhost:3335', API_MOCKS: false } }))
vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

// Keep the installed Transmit implementation real: its pending-create timer is
// the regression under test. Only the browser/network boundaries are replaced.
class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, EventListener[]>()
  closed = false
  constructor(
    readonly url: URL,
    readonly options: EventSourceInit
  ) {
    FakeEventSource.instances.push(this)
  }
  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }
  emit(type: string, event: Event = new Event(type)) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
  close() {
    this.closed = true
  }
}

const fetcher = vi.fn<typeof fetch>()
let cleanup: (() => void) | undefined
function mount(workspace = 'company-a') {
  useSearchStream(workspace)
  cleanup = harness.effect?.() || undefined
  return FakeEventSource.instances.at(-1)!
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  FakeEventSource.instances = []
  fetcher.mockImplementation(async () => new Response('', { status: 200 }))
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.stubGlobal('fetch', fetcher)
})
afterEach(async () => {
  cleanup?.()
  cleanup = undefined
  await vi.advanceTimersByTimeAsync(0)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('search stream lifecycle', () => {
  it('does not create a retry timer or subscription after cleanup before the first connection', async () => {
    const source = mount()
    expect(source.options.withCredentials).toBe(true)
    expect(source.url.pathname).toBe('/api/v1/__transmit/events')
    expect(fetcher).not.toHaveBeenCalled()
    cleanup?.()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(source.closed).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    expect(fetcher).not.toHaveBeenCalled()
    expect(harness.invalidateQueries).not.toHaveBeenCalled()
  })

  it('handles a StrictMode remount with one active credentialed subscription', async () => {
    const abandoned = mount()
    cleanup?.()
    const active = mount()
    active.emit('open')
    await vi.advanceTimersByTimeAsync(0)
    expect(abandoned.closed).toBe(true)
    expect(active.closed).toBe(false)
    expect(fetcher).toHaveBeenCalledOnce()
    const request = fetcher.mock.calls[0]![0] as Request
    expect(request.url).toBe('http://localhost:3335/api/v1/__transmit/subscribe')
    expect(request.credentials).toBe('include')
    expect(await request.json()).toMatchObject({ channel: 'workspaces/company-a/lookups' })
    expect(harness.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['workspaces', 'company-a', 'searches'],
    })
  })

  it('unsubscribes a creation that resolves after the component has closed', async () => {
    let accept: (response: Response) => void = () => undefined
    fetcher.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          accept = resolve
        })
    )
    const source = mount()
    source.emit('open')
    cleanup?.()
    expect(source.closed).toBe(true)
    expect(fetcher).toHaveBeenCalledOnce()
    accept(new Response('', { status: 200 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect((fetcher.mock.calls[1]![0] as Request).url).toBe(
      'http://localhost:3335/api/v1/__transmit/unsubscribe'
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('invalidates its own company on messages and reconnect, then ignores messages after cleanup', async () => {
    const source = mount('company-b')
    source.emit('open')
    await vi.advanceTimersByTimeAsync(0)
    harness.invalidateQueries.mockClear()
    const message = (channel: string) =>
      new MessageEvent('message', { data: JSON.stringify({ channel, payload: { changed: true } }) })
    source.emit('message', message('workspaces/company-a/lookups'))
    expect(harness.invalidateQueries).not.toHaveBeenCalled()
    source.emit('message', message('workspaces/company-b/lookups'))
    expect(harness.invalidateQueries).toHaveBeenCalledOnce()
    expect(harness.invalidateQueries).toHaveBeenLastCalledWith({
      queryKey: ['workspaces', 'company-b', 'searches'],
    })
    source.emit('error')
    source.emit('open')
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.invalidateQueries).toHaveBeenCalledTimes(2)
    expect(fetcher).toHaveBeenCalledTimes(2)
    cleanup?.()
    source.emit('message', message('workspaces/company-b/lookups'))
    expect(harness.invalidateQueries).toHaveBeenCalledTimes(2)
  })
})
