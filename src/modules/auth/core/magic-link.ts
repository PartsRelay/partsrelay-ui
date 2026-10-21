import { addSeconds, differenceInSeconds } from 'date-fns'
import { z } from 'zod'

export const MAGIC_LINK_MINUTES = 10

export const RESEND_AFTER_SECONDS = 30

const email = z.email()

// The core answers a generic error and limits sign in
export function emailError(value: string) {
  return email.safeParse(value.trim()).success ? undefined : 'login.magic-link.errors.email'
}

export function resendWait(sentAt: number | null, now: number) {
  if (sentAt === null) return 0

  const until = addSeconds(sentAt, RESEND_AFTER_SECONDS)

  return Math.max(0, differenceInSeconds(until, now, { roundingMethod: 'ceil' }))
}
