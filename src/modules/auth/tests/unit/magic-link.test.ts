import { describe, expect, it } from 'vite-plus/test'
import { MAX_STRING_LENGTH } from '@/core/strings'
import { emailError, RESEND_AFTER_SECONDS, resendWait } from '@/modules/auth/core/magic-link'

describe('emailError', () => {
  it('accepts a valid address, spaces around it included', () => {
    expect(emailError('mark.reed@redwoodparts.com')).toBeUndefined()
    expect(emailError('  mark.reed@redwoodparts.com  ')).toBeUndefined()
  })

  it.each(['', '   ', 'mark', 'mark@', '@redwoodparts.com', 'mark reed@redwoodparts.com'])(
    'rejects %j with the invalid email key',
    (value) => {
      expect(emailError(value)).toBe('errors.invalid-email')
    }
  )

  it('rejects an address longer than the core accepts', () => {
    const local = 'm'.repeat(MAX_STRING_LENGTH)

    expect(emailError(`${local}@redwoodparts.com`)).toBe('form.too-long')
  })
})

describe('resendWait', () => {
  const sentAt = Date.parse('2026-10-21T10:00:00Z')

  it('is zero before any link was sent', () => {
    expect(resendWait(null, sentAt)).toBe(0)
  })

  it('waits the whole interval right after sending', () => {
    expect(resendWait(sentAt, sentAt)).toBe(RESEND_AFTER_SECONDS)
  })

  it('rounds partial seconds up', () => {
    expect(resendWait(sentAt, sentAt + 10_200)).toBe(20)
    expect(resendWait(sentAt, sentAt + 29_001)).toBe(1)
  })

  it('is zero once the interval is over', () => {
    expect(resendWait(sentAt, sentAt + RESEND_AFTER_SECONDS * 1000)).toBe(0)
    expect(resendWait(sentAt, sentAt + 45_000)).toBe(0)
  })
})
