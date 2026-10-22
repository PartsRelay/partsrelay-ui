import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { startOneTap } from '@/modules/auth/core/one-tap'

const harness = vi.hoisted(() => ({
  env: { API_MOCKS: false, LOCAL_REVIEW_AUTH: false, GOOGLE_CLIENT_ID: 'public-client-id' },
  oneTap: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/env', () => ({ env: harness.env }))
vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { oneTap: harness.oneTap } }))

beforeEach(() => {
  vi.clearAllMocks()
  harness.env.API_MOCKS = false
  harness.env.LOCAL_REVIEW_AUTH = false
  harness.env.GOOGLE_CLIENT_ID = 'public-client-id'
})

describe('Google One Tap boundary', () => {
  it('does not initialize Google in local review mode even with a configured public client ID', () => {
    harness.env.LOCAL_REVIEW_AUTH = true
    const onSuccess = vi.fn()
    const onError = vi.fn()
    startOneTap({ onSuccess, onError })
    expect(harness.oneTap).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('does not initialize Google in preview mode even with a configured public client ID', () => {
    harness.env.API_MOCKS = true
    startOneTap({ onSuccess: vi.fn(), onError: vi.fn() })
    expect(harness.oneTap).not.toHaveBeenCalled()
  })

  it('does not initialize Google without a configured public client ID', () => {
    harness.env.GOOGLE_CLIENT_ID = ''
    startOneTap({ onSuccess: vi.fn(), onError: vi.fn() })
    expect(harness.oneTap).not.toHaveBeenCalled()
  })

  it('allows configured live authentication and passes failures to its caller', async () => {
    const error = new TypeError('Google unavailable')
    const onError = vi.fn()
    harness.oneTap.mockRejectedValueOnce(error)
    startOneTap({ onSuccess: vi.fn(), onError })
    await Promise.resolve()
    expect(harness.oneTap).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(error)
  })
})
