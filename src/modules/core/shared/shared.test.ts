import { describe, expect, it } from 'vite-plus/test'
import { canConfirm } from '@/modules/core/shared/confirm'
import {
  firstName,
  formatDate,
  formatPhone,
  formatWhen,
  initials,
} from '@/modules/core/shared/format'
import { message } from '@/modules/core/shared/message'
import { checkName, NAME_MAX } from '@/modules/core/shared/name'
import { resolveNotice } from '@/modules/core/shared/notice'
import { pageInfo } from '@/modules/core/shared/pagination'
import { pageFixture } from '@/modules/core/testing/fixtures'

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

  it('tells when something happened, with the year only when it differs', () => {
    const now = new Date(2026, 9, 15, 11, 5)

    expect(formatWhen(new Date(2026, 9, 15, 9, 26), now, 'en')).toEqual(
      message('format.todayAt', { time: '09:26' })
    )
    expect(formatWhen(new Date(2026, 9, 14, 16, 12).toISOString(), now, 'en')).toEqual(
      message('format.dateAt', { date: '14 Oct', time: '16:12' })
    )
    expect(formatWhen(new Date(2025, 11, 31, 23, 59), now, 'it')).toEqual(
      message('format.dateAt', { date: '31 dic 2025', time: '23:59' })
    )
  })

  it('groups WhatsApp numbers and keeps unknown ones', () => {
    expect(formatPhone('390287341190')).toBe('+39 02 8734 1190')
    expect(formatPhone('393335550126')).toBe('+39 333 555 0126')
    expect(formatPhone('4915112345678')).toBe('+49 1511 2345678')
    expect(formatPhone('12')).toBe('+12')
  })
})

describe('pagination', () => {
  it('tells the shown range and the pages around it', () => {
    const second = pageInfo(pageFixture([], 2, 20, 45).metadata)

    expect(second).toMatchObject({ from: 21, to: 40, page: 2, pages: 3, outOfRange: false })
    expect(second).toMatchObject({ hasPrevious: true, hasNext: true })
    expect(second.range).toEqual(message('pagination.range', { from: 21, to: 40, total: 45 }))
    expect(pageInfo(pageFixture([], 3, 20, 45).metadata)).toMatchObject({ to: 45, hasNext: false })
  })

  it('notices a page past the end and an empty list', () => {
    expect(pageInfo(pageFixture([], 4, 20, 45).metadata).outOfRange).toBe(true)
    expect(pageInfo(pageFixture([]).metadata)).toMatchObject({
      from: 0,
      to: 0,
      pages: 1,
      outOfRange: false,
    })
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
