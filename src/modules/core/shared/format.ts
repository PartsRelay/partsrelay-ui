export const EMPTY_VALUE = '—'

export function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value)
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? ''
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1)

  return letters.map((word) => word!.charAt(0).toUpperCase()).join('')
}

export function dateFormat(locale: string | undefined, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, options)
}

export function formatDate(
  value: Date | string,
  locale?: string,
  month: 'short' | 'long' = 'short'
) {
  return dateFormat(locale, { day: 'numeric', month, year: 'numeric' }).format(toDate(value))
}
