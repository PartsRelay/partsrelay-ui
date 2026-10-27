import { addSeconds, differenceInSeconds } from 'date-fns'
import { z } from 'zod'

export const MAGIC_LINK_MINUTES = 10

export const RESEND_AFTER_SECONDS = 30

export const emailSchema = z.string().trim().pipe(z.email('errors.invalid-email'))

export function resendWait(sentAt: number | null, now: number) {
  if (sentAt === null) return 0

  const until = addSeconds(sentAt, RESEND_AFTER_SECONDS)

  return Math.max(0, differenceInSeconds(until, now, { roundingMethod: 'ceil' }))
}
