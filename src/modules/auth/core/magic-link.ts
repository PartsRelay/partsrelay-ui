import { addSeconds, differenceInSeconds } from 'date-fns'
import { z } from 'zod'
import { lengthError } from '@/core/strings'

export const MAGIC_LINK_MINUTES = 10

export const RESEND_AFTER_SECONDS = 30

const email = z.email()

export function emailError(value: string) {
  const invalid = email.safeParse(value.trim()).success ? undefined : 'errors.invalid-email'

  return lengthError(value) ?? invalid
}

export function resendWait(sentAt: number | null, now: number) {
  if (sentAt === null) return 0

  const until = addSeconds(sentAt, RESEND_AFTER_SECONDS)

  return Math.max(0, differenceInSeconds(until, now, { roundingMethod: 'ceil' }))
}
