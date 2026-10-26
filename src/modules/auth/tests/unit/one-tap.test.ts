import { describe, expect, it, vi } from 'vite-plus/test'
import { oneTapError } from '@/modules/auth/core/one-tap'

// Only startOneTap calls it, the real client needs a browser
vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: {} }))

// What the Better Auth client throws
const authError = (status: number, code: string) => ({
  status,
  error: { code, status, message: 'Failed' },
})

describe('oneTapError', () => {
  it('stays quiet when the Google script fails', () => {
    expect(oneTapError(new Error('Google script failed to load'))).toBeNull()
  })

  it('reports a network failure', () => {
    expect(oneTapError(new TypeError('Failed to fetch'))).toEqual(['errors.network-error'])
  })

  it('reports a generic failure as a Google sign in failure', () => {
    expect(oneTapError(authError(500, 'internal-server-error'))).toEqual(['login.errors.google'])
    expect(oneTapError(authError(400, 'bad-request'))).toEqual(['login.errors.google'])
  })

  it('explains a coded error of the core', () => {
    expect(oneTapError(authError(403, 'email-not-verified'))).toEqual(['errors.email-not-verified'])
  })
})
