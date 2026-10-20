import { format, type Locale } from 'date-fns'
import { enGB, it } from 'date-fns/locale'

export const EMPTY_VALUE = '—'

const DATE_LOCALES: Record<string, Locale> = { en: enGB, it }

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? ''
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1)

  return letters.map((word) => word!.charAt(0).toUpperCase()).join('')
}

export function formatDate(value: Date | string, locale?: string) {
  return format(value, 'PP', { locale: DATE_LOCALES[locale ?? ''] ?? enGB })
}
