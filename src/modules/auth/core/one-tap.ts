import { postOneTapCallback } from '@/core/api/auth/endpoints/one-tap/one-tap'
import { errorCode, errorMessage, errorStatus } from '@/core/errors'
import { message } from '@/core/message'
import { env } from '@/env'

type OneTapHandlers = { onSuccess: () => Promise<void> | void; onError: (error: unknown) => void }

type GoogleIdentity = {
  initialize: (config: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select: boolean
    cancel_on_tap_outside: boolean
    context: 'signin'
    use_fedcm_for_prompt: boolean
  }) => void
  prompt: () => void
  cancel: () => void
  disableAutoSelect: () => void
}

type GoogleWindow = Window & { google?: { accounts: { id: GoogleIdentity } } }

const SCRIPT = 'https://accounts.google.com/gsi/client'
let script: Promise<void> | null = null

function googleIdentity() {
  return (window as GoogleWindow).google?.accounts.id
}

function loadScript() {
  script ??= new Promise<void>((resolve, reject) => {
    const tag = Object.assign(document.createElement('script'), { src: SCRIPT, async: true })
    tag.addEventListener('load', () => resolve())
    tag.addEventListener('error', () => {
      script = null
      reject(new Error('Google Identity Services did not load'))
    })
    document.head.append(tag)
  })

  return script
}

export async function startOneTap({ onSuccess, onError }: OneTapHandlers) {
  const clientId = env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) return

  // A blocked or missing Google script only hides One Tap
  const identity = await loadScript()
    .then(googleIdentity)
    .catch(() => undefined)
  if (!identity) return

  identity.initialize({
    client_id: clientId,
    callback: ({ credential }) =>
      void postOneTapCallback({ idToken: credential }).then(onSuccess, onError),
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin',
    use_fedcm_for_prompt: true,
  })
  identity.prompt()
}

export function cancelOneTap({ signedOut = false } = {}) {
  const identity = googleIdentity()
  identity?.cancel()
  if (signedOut) identity?.disableAutoSelect()
}

export function oneTapError(error: unknown) {
  if (errorStatus(error) === undefined && errorCode(error) !== 'NETWORK_ERROR') return null

  return errorCode(error) === 'UNKNOWN' ? message('errors.AUTH_GOOGLE_FAILED') : errorMessage(error)
}
