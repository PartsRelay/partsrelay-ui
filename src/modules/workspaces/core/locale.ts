export const locales = ['en', 'it'] as const

export type Locale = (typeof locales)[number]

export const FALLBACK_LOCALE: Locale = 'en'

export const localeNames: Record<Locale, string> = { en: 'English', it: 'Italiano' }

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : FALLBACK_LOCALE
}
