import { env } from '@/env'
import { authClient } from '@/modules/auth/core/auth.client'
import { errorMessage, NO_STATUS, statusCode, toErrorBody } from '@/core/errors'
import { message } from '@/core/message'

type OneTapHandlers = { onSuccess: () => Promise<void> | void; onError: (error: unknown) => void }

type GoogleWindow = Window & { google?: { accounts: { id: { cancel: () => void } } } }

export function startOneTap({ onSuccess, onError }: OneTapHandlers) {
  if (!env.GOOGLE_CLIENT_ID) return

  authClient
    .oneTap({
      autoSelect: false,
      cancelOnTapOutside: true,
      fetchOptions: { onSuccess: () => onSuccess() },
    })
    .catch(onError)
}

export function cancelOneTap() {
  ;(window as GoogleWindow).google?.accounts.id.cancel()
}

export function oneTapError(error: unknown) {
  const { code, status } = toErrorBody(error)
  if (status === NO_STATUS && code !== 'network-error') return null

  return code === statusCode(status) ? message('login.errors.google') : errorMessage(error)
}
