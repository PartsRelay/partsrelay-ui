import { HttpResponse } from 'msw'
import type { FieldError } from '@/core/errors'

export function fail(status: number, code: string, message: string, fields?: FieldError[]): never {
  throw HttpResponse.json({ code, status, message, ...(fields && { fields }) }, { status })
}

function invalid(fields: FieldError[]): never {
  return fail(422, 'validation-error', 'The request failed validation', fields)
}

export const rejected = (field: string, rule: string) => invalid([{ field, rule }])

function trimmed(value: unknown): unknown {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) return value.map(trimmed)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, trimmed(item)]))
}

export async function apiBody<T>(request: Request) {
  const body = trimmed(await request.json())

  return body as { [Key in keyof T]?: T[Key] | null }
}
