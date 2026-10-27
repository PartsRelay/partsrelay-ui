import { locales } from '@/i18n'

export type Locale = string

export const FALLBACK_LOCALE: Locale = 'en-US'

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : FALLBACK_LOCALE
}
