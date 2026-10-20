import { createStore } from '@tanstack/store'
import { addSeconds, differenceInSeconds } from 'date-fns'
import { z } from 'zod'
import { type Message, message } from '@/core/message'

export const MAGIC_LINK_MINUTES = 10

export const RESEND_AFTER_SECONDS = 30

const email = z.email()

export type MagicLinkState = {
  email: string
  sent: string | null
  sentAt: number | null
  error: Message | null
}

export function resendWait(sentAt: number | null, now: number) {
  if (sentAt === null) return 0

  const until = addSeconds(sentAt, RESEND_AFTER_SECONDS)

  return Math.max(0, differenceInSeconds(until, now, { roundingMethod: 'ceil' }))
}

export function createMagicLinkForm() {
  return createStore<MagicLinkState, MagicLinkActions>(
    { email: '', sent: null, sentAt: null, error: null },
    ({ setState, get }) => ({
      setEmail: (value) => setState((state) => ({ ...state, email: value, error: null })),
      submit: () => {
        const address = get().email.trim().toLowerCase()
        const valid = email.safeParse(address).success
        setState((state) => ({
          ...state,
          error: valid ? null : message('login.magicLink.errors.email'),
        }))

        return valid ? address : null
      },
      sent: (address, at) =>
        setState((state) => ({ ...state, sent: address, sentAt: at, error: null })),
      failed: (error) => setState((state) => ({ ...state, error })),
      edit: () => setState((state) => ({ ...state, sent: null, sentAt: null, error: null })),
    })
  )
}

type MagicLinkActions = {
  setEmail: (value: string) => void
  submit: () => string | null
  sent: (address: string, at: number) => void
  failed: (error: Message) => void
  edit: () => void
}
