import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const stored = new Map<string, string>()
const setLanguage = vi.fn()

function browserLanguage(language: string, saved?: string) {
  if (saved) stored.set('partsrelay.language', saved)
  const localStorage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  }
  vi.stubGlobal('window', { localStorage })
  vi.stubGlobal('localStorage', localStorage)
  vi.stubGlobal('navigator', { language, languages: [language] })
  vi.stubGlobal('document', {
    documentElement: { setAttribute: setLanguage },
  })
}

async function loadLanguage() {
  const { i18n } = await import('./i18n')
  await vi.waitFor(() => expect(i18n.isInitialized).toBe(true))
  return i18n
}

describe('interface language', () => {
  beforeEach(() => {
    vi.resetModules()
    stored.clear()
    setLanguage.mockClear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('uses the browser language when no preference has been saved', async () => {
    browserLanguage('it-CH')
    const i18n = await loadLanguage()
    expect(i18n.resolvedLanguage).toBe('it-IT')
    expect(setLanguage).toHaveBeenCalledWith('lang', 'it-IT')
  })

  it('uses a saved preference before the browser language', async () => {
    browserLanguage('it-IT', 'en-US')
    const i18n = await loadLanguage()
    expect(i18n.resolvedLanguage).toBe('en-US')
  })

  it.each([
    ['it', 'it-IT'],
    ['en', 'en-US'],
  ])('normalizes an existing %s preference to %s', async (saved, expected) => {
    browserLanguage('de-DE', saved)
    const i18n = await loadLanguage()
    expect(i18n.resolvedLanguage).toBe(expected)
  })

  it('falls back to English for an unsupported browser language', async () => {
    browserLanguage('de-DE')
    const i18n = await loadLanguage()
    expect(i18n.resolvedLanguage).toBe('en-US')
  })

  it('persists a chosen language and updates the page language', async () => {
    browserLanguage('en-GB')
    const i18n = await loadLanguage()
    await i18n.changeLanguage('it-IT')
    expect(stored.get('partsrelay.language')).toBe('it-IT')
    expect(setLanguage).toHaveBeenLastCalledWith('lang', 'it-IT')
  })
})
