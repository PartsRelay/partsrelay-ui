import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { message } from '@/modules/core/shared/message'

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

export function formatWhen(value: Date | string, now: Date, locale?: string) {
  const date = toDate(value)
  const time = dateFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date)
  if (date.toDateString() === now.toDateString()) return message('format.todayAt', { time })

  const year = date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  const day = dateFormat(locale, { day: 'numeric', month: 'short', year }).format(date)

  return message('format.dateAt', { date: day, time })
}

// The catalog has no prices yet, the core sends null
export const NO_PRICE = '-'

export function formatPrice(price: number | null, locale?: string) {
  if (price === null) return NO_PRICE

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

// WhatsApp ids are the international number without the plus
export function formatPhone(waId: string) {
  const phone = `+${waId}`

  return parsePhoneNumberFromString(phone)?.formatInternational() ?? phone
}
