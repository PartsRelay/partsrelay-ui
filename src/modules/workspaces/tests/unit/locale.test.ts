import { describe, expect, it } from 'vite-plus/test'
import { FALLBACK_LOCALE, isLocale, toLocale } from '@/modules/workspaces/core/locale'

describe('isLocale', () => {
  it('knows only the full locales of the app', () => {
    expect(isLocale('en-US')).toBe(true)
    expect(isLocale('it-IT')).toBe(true)
    expect(isLocale('it')).toBe(false)
    expect(isLocale('en-GB')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})

describe('toLocale', () => {
  it('keeps a known locale', () => {
    expect(toLocale('it-IT')).toBe('it-IT')
  })

  it.each(['fr-FR', 'it', '', undefined, 42])('falls back to English for %j', (value) => {
    expect(toLocale(value)).toBe(FALLBACK_LOCALE)
    expect(FALLBACK_LOCALE).toBe('en-US')
  })
})
