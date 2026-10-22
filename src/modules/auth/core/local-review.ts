import { env } from '@/env'
import { redirectPath } from '@/modules/auth/core/redirect-path'

function unavailable(status = 503) {
  return { status, error: { code: 'LOCAL_REVIEW_UNAVAILABLE' } }
}

async function localSession(method: 'POST' | 'DELETE') {
  if (
    !import.meta.env.DEV ||
    !env.LOCAL_REVIEW_AUTH ||
    window.location.origin !== 'http://localhost:5173'
  ) {
    throw unavailable()
  }

  return fetch('/__local-review/session', {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-PartsRelay-Local-Review': 'true',
    },
    body: '{}',
    signal: AbortSignal.timeout(10_000),
  })
}

export async function signInToLocalReview(back: string) {
  const response = await localSession('POST')
  if (response.status !== 204) throw unavailable(response.status)
  // A full navigation discards prior account caches and runs the real API guards.
  window.location.assign(redirectPath(back))
}

export async function signOutOfLocalReview() {
  const response = await localSession('DELETE')
  // Non-fixture accounts must use the backend's ordinary session revocation.
  if (response.status === 409) return false
  if (response.status !== 204) throw unavailable(response.status)
  return true
}
