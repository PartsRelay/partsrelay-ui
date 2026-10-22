import { describe, expect, it } from 'vite-plus/test'
import { serializeLocale, toLocale } from '@/modules/workspaces/core/locale'

describe('workspace locale compatibility', () => {
  it.each([
    ['en', 'en-US'],
    ['it', 'it-IT'],
    ['en-US', 'en-US'],
    ['it-IT', 'it-IT'],
  ] as const)('displays backend locale %s as %s', (stored, expected) => {
    expect(toLocale(stored)).toBe(expected)
  })

  it.each(['en', 'it'])('preserves the current core language convention for %s', (stored) => {
    expect(serializeLocale('en-US', stored)).toBe('en')
    expect(serializeLocale('it-IT', stored)).toBe('it')
  })

  it.each(['en-US', 'it-IT'])('preserves the newer core regional convention for %s', (stored) => {
    expect(serializeLocale('en-US', stored)).toBe('en-US')
    expect(serializeLocale('it-IT', stored)).toBe('it-IT')
  })

  it('uses the full locale convention when no recognized stored language exists', () => {
    expect(serializeLocale('it-IT', undefined)).toBe('it-IT')
    expect(toLocale('unexpected')).toBe('en-US')
  })
})
