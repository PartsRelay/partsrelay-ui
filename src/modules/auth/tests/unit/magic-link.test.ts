import { describe, expect, it } from 'vite-plus/test'
import { emailError } from '@/modules/auth/core/magic-link'

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
})
