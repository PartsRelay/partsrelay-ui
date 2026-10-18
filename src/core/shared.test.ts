import { describe, expect, it } from 'vite-plus/test'
import { canConfirm } from '@/core/confirm'
import { firstName, formatDate, initials } from '@/core/format'
import { message } from '@/core/message'
import { checkName, NAME_MAX } from '@/core/name'
import { resolveNotice } from '@/core/notice'

describe('format', () => {
  it('builds initials and first names', () => {
    expect(initials('Marco Rossi')).toBe('MR')
    expect(initials('Giulia Maria Bianchi')).toBe('GB')
    expect(initials('luca@gmail.com')).toBe('L')
    expect(initials('  ')).toBe('')
    expect(firstName('Marco Rossi')).toBe('Marco')
  })

  it('writes the day before the month in both languages', () => {
    const day = new Date(2026, 9, 15, 9, 26)

    expect(formatDate(day, 'en')).toBe('15 Oct 2026')
    expect(formatDate(day, 'it')).toBe('15 ott 2026')
    expect(formatDate(day, 'en', 'long')).toBe('15 October 2026')
  })
})

describe('names', () => {
  const required = message('setup.errors.nameRequired')

  it('trims and requires a name that fits', () => {
    expect(checkName('  Officina Neri ', required)).toEqual({ value: 'Officina Neri', error: null })
    expect(checkName('   ', required)).toEqual({ value: '', error: required })
    expect(checkName('x'.repeat(NAME_MAX + 1), required).error).toEqual(
      message('validation.tooLong', { max: NAME_MAX })
    )
  })
})

describe('confirm and notices', () => {
  const spec = {
    title: message('t'),
    body: message('b'),
    action: message('a'),
    tone: 'danger' as const,
    typeToConfirm: 'Ricambi Rossi S.r.l.',
  }

  it('unlocks only on the exact text', () => {
    expect(canConfirm(spec, 'Ricambi Rossi')).toBe(false)
    expect(canConfirm(spec, ' Ricambi Rossi S.r.l. ')).toBe(true)
    expect(canConfirm({ ...spec, typeToConfirm: undefined }, '')).toBe(true)
  })

  it('waits for the acknowledgement when one is asked', () => {
    const acknowledged = { ...spec, acknowledge: message('k') }

    expect(canConfirm(acknowledged, 'Ricambi Rossi S.r.l.')).toBe(false)
    expect(canConfirm(acknowledged, 'Ricambi Rossi', true)).toBe(false)
    expect(canConfirm(acknowledged, 'Ricambi Rossi S.r.l.', true)).toBe(true)
  })

  it('resolves static and computed notices', () => {
    expect(resolveNotice(undefined, undefined, undefined)).toBeNull()
    expect(resolveNotice({ notice: message('a') }, 1, 2)).toEqual(message('a'))
    expect(
      resolveNotice({ notice: (role: string) => message('b', { role }) }, 'admin', undefined)
    ).toEqual(message('b', { role: 'admin' }))
  })
})
