import { env } from '@/env'
import { authClient } from '@/modules/auth/core/auth.client'
import { errorCode, errorMessage, errorStatus } from '@/core/errors'
import { message } from '@/core/message'

type OneTapHandlers = { onSuccess: () => Promise<void> | void; onError: (error: unknown) => void }

type GoogleIdentity = { google?: { accounts: { id: { cancel: () => void } } } }

export function startOneTap({ onSuccess, onError }: OneTapHandlers) {
  if (!env.VITE_GOOGLE_CLIENT_ID) return

  authClient.oneTap({ fetchOptions: { onSuccess } }).catch(onError)
}

export function cancelOneTap() {
  const { google } = window as GoogleIdentity

  google?.accounts.id.cancel()
}

export function oneTapError(error: unknown) {
  // Without a status the Google script failed, so stay quiet
  if (errorStatus(error) === undefined) return null

  return errorCode(error) === 'UNKNOWN' ? message('errors.AUTH_GOOGLE_FAILED') : errorMessage(error)
}
