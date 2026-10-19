import { env } from '@/env'
import { authClient } from '@/modules/auth/core/auth.client'
import { errorMessage, isGenericCode, toAppError } from '@/core/errors'
import { message } from '@/core/message'

type OneTapHandlers = { onSuccess: () => Promise<void> | void; onError: (error: unknown) => void }

type GoogleWindow = Window & { google?: { accounts: { id: { cancel: () => void } } } }

export function startOneTap({ onSuccess, onError }: OneTapHandlers) {
  if (!env.VITE_GOOGLE_CLIENT_ID) return

  authClient
    .oneTap({
      autoSelect: false,
      cancelOnTapOutside: true,
      // fetchOptions keeps the client from redirecting
      fetchOptions: { onSuccess: () => onSuccess() },
    })
    .catch(onError)
}

export function cancelOneTap() {
  ;(window as GoogleWindow).google?.accounts.id.cancel()
}

export function oneTapError(error: unknown) {
  const { code, status } = toAppError(error)
  // A Google script that fails to load stays quiet
  if (status === null && code !== 'NETWORK_ERROR') return null

  return isGenericCode(code) ? message('errors.AUTH_GOOGLE_FAILED') : errorMessage(error)
}
