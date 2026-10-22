import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { signInToLocalReview, signOutOfLocalReview } from '@/modules/auth/core/local-review'

const harness = vi.hoisted(() => ({ env: { LOCAL_REVIEW_AUTH: false } }))
vi.mock('@/env', () => ({ env: harness.env }))

const fetcher = vi.fn<typeof fetch>()
const assign = vi.fn()

beforeEach(() => {
  harness.env.LOCAL_REVIEW_AUTH = true
  fetcher.mockReset().mockResolvedValue(new Response(null, { status: 204 }))
  assign.mockReset()
  vi.stubEnv('DEV', true)
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173', assign } })
})

afterEach(() => {
  harness.env.LOCAL_REVIEW_AUTH = false
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function expectUnavailableWithoutRequest() {
  const failure = { status: 503, error: { code: 'LOCAL_REVIEW_UNAVAILABLE' } }
  await expect(signInToLocalReview('/searches')).rejects.toEqual(failure)
  await expect(signOutOfLocalReview()).rejects.toEqual(failure)
  expect(fetcher).not.toHaveBeenCalled()
  expect(assign).not.toHaveBeenCalled()
}

describe('local review request boundary', () => {
  it('does not send a request when the local review flag is disabled', async () => {
    harness.env.LOCAL_REVIEW_AUTH = false
    await expectUnavailableWithoutRequest()
  })

  it('does not send a request from a production bundle even if the flag is present', async () => {
    vi.stubEnv('DEV', false)
    await expectUnavailableWithoutRequest()
  })

  it.each([
    'https://partsrelay.example.com',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'https://localhost:5173',
  ])('does not send a request from the unapproved origin %s', async (origin) => {
    vi.stubGlobal('window', { location: { origin, assign } })
    await expectUnavailableWithoutRequest()
  })

  it('waits for a 204 response from the fixed same-origin POST before navigating', async () => {
    let complete!: (response: Response) => void
    fetcher.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        complete = resolve
      })
    )
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    const request = signInToLocalReview('/searches?page=2&requester=contact')
    expect(assign).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('/__local-review/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-PartsRelay-Local-Review': 'true',
      },
      body: '{}',
      signal: expect.any(AbortSignal),
    })
    expect(timeout).toHaveBeenCalledExactlyOnceWith(10_000)

    complete(new Response(null, { status: 204 }))
    await request
    expect(assign).toHaveBeenCalledExactlyOnceWith('/searches?page=2&requester=contact')
  })

  it.each([
    'https://outside.example.com',
    '//outside.example.com',
    '/%2foutside.example.com',
    '/%5coutside.example.com',
  ])('sanitizes the post-login destination %s without changing the endpoint', async (back) => {
    await signInToLocalReview(back)
    expect(fetcher.mock.calls[0]?.[0]).toBe('/__local-review/session')
    expect(assign).toHaveBeenCalledExactlyOnceWith('/')
  })

  it.each([200, 201, 302, 401, 409, 503])(
    'does not navigate when sign-in returns status %s instead of 204',
    async (status) => {
      fetcher.mockResolvedValueOnce(new Response(null, { status }))
      await expect(signInToLocalReview('/searches')).rejects.toEqual({
        status,
        error: { code: 'LOCAL_REVIEW_UNAVAILABLE' },
      })
      expect(fetcher).toHaveBeenCalledOnce()
      expect(assign).not.toHaveBeenCalled()
    }
  )

  it('does not navigate or retry after a failed network request', async () => {
    const failure = new TypeError('Local review endpoint unavailable')
    fetcher.mockRejectedValueOnce(failure)
    await expect(signInToLocalReview('/searches')).rejects.toBe(failure)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('local review sign-out', () => {
  it('returns true for DELETE 204 without navigating', async () => {
    await expect(signOutOfLocalReview()).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('/__local-review/session', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-PartsRelay-Local-Review': 'true',
      },
      body: '{}',
      signal: expect.any(AbortSignal),
    })
    expect(assign).not.toHaveBeenCalled()
  })

  it('returns false for DELETE 409 so ordinary account revocation can run', async () => {
    fetcher.mockResolvedValueOnce(new Response(null, { status: 409 }))
    await expect(signOutOfLocalReview()).resolves.toBe(false)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(assign).not.toHaveBeenCalled()
  })

  it.each([200, 401, 403, 503])(
    'rejects DELETE status %s instead of treating it as sign-out',
    async (status) => {
      fetcher.mockResolvedValueOnce(new Response(null, { status }))
      await expect(signOutOfLocalReview()).rejects.toEqual({
        status,
        error: { code: 'LOCAL_REVIEW_UNAVAILABLE' },
      })
      expect(fetcher).toHaveBeenCalledOnce()
      expect(assign).not.toHaveBeenCalled()
    }
  )
})
