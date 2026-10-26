import { HttpResponse } from 'msw'
import type { FieldError } from '@/core/errors'
import { MAX_STRING_LENGTH } from '@/core/strings'

const UNCAPPED = new Set([
  'idToken',
  'token',
  'accessToken',
  'refreshToken',
  'callbackURL',
  'errorCallbackURL',
  'newUserCallbackURL',
])

export function fail(status: number, code: string, message: string, fields?: FieldError[]): never {
  throw HttpResponse.json({ code, status, message, ...(fields && { fields }) }, { status })
}

export function invalid(fields: FieldError[]): never {
  return fail(422, 'validation-error', 'The request failed validation', fields)
}

export const rejected = (field: string, rule: string) => invalid([{ field, rule }])

function longStrings(value: unknown, path = ''): string[] {
  const key = path.split('.').at(-1) ?? ''

  if (UNCAPPED.has(key)) return []
  if (key === 'metadata' && value && typeof value === 'object') {
    return longStrings(JSON.stringify(value), path)
  }
  if (typeof value === 'string') return value.length > MAX_STRING_LENGTH ? [path] : []
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([name, item]) =>
    longStrings(item, path ? `${path}.${name}` : name)
  )
}

function queryOf(url: string) {
  const params = new URL(url).searchParams

  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const values = params.getAll(key)

      return [
        key.replace(/\[\]$/, ''),
        key.endsWith('[]') || values.length > 1 ? values : values[0],
      ]
    })
  )
}

function cap(request: Request, body: unknown) {
  const fields = [...longStrings(queryOf(request.url)), ...longStrings(body)]

  if (fields.length > 0) invalid(fields.map((field) => ({ field, rule: 'maxLength' })))
}

export async function capStrings(request: Request) {
  const body: unknown = await request
    .clone()
    .json()
    .catch(() => null)

  cap(request, body)
}

function trimmed(value: unknown): unknown {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) return value.map(trimmed)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, trimmed(item)]))
}

export async function apiBody<T>(request: Request) {
  const body = trimmed(await request.json())
  cap(request, body)

  return body as { [Key in keyof T]?: T[Key] | null }
}
