import { z } from 'zod'
import { errorKey } from '@/core/errors'

export const MAGIC_LINK_MINUTES = 10

export const RESEND_AFTER_SECONDS = 30

const email = z.email()

// The core answers a generic error and limits sign in
export function emailError(value: string) {
  return email.safeParse(value.trim()).success ? undefined : errorKey('INVALID_EMAIL')
}
