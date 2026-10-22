export const locales = ['en-US', 'it-IT'] as const

export type Locale = (typeof locales)[number]

export const FALLBACK_LOCALE: Locale = 'en-US'

export const localeNames: Record<Locale, string> = { 'en-US': 'English', 'it-IT': 'Italiano' }

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

export function toLocale(value: unknown): Locale {
  if (value === 'en') return 'en-US'
  if (value === 'it') return 'it-IT'
  return isLocale(value) ? value : FALLBACK_LOCALE
}

// Existing core versions store language-only tags; newer ones use regional tags.
export function serializeLocale(locale: Locale, storedLocale: unknown) {
  if (storedLocale === 'en' || storedLocale === 'it') {
    return locale === 'it-IT' ? 'it' : 'en'
  }
  return locale
}
