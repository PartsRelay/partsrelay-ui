import { intlFormat } from 'date-fns'

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1)

  return letters.map((word) => word!.charAt(0).toUpperCase()).join('')
}

// English dates in the British order, day first
export function formatDate(value: Date | string, locale?: string) {
  return intlFormat(
    value,
    { day: 'numeric', month: 'short', year: 'numeric' },
    { locale: locale === 'it' ? 'it' : 'en-GB' }
  )
}
