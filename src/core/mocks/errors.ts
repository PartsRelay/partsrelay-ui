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

export async function capStrings(request: Request) {
  const query = queryOf(request.url)
  const body: unknown = await request
    .clone()
    .json()
    .catch(() => null)
  const fields = [...longStrings(query), ...longStrings(body)]

  if (fields.length > 0) invalid(fields.map((field) => ({ field, rule: 'maxLength' })))
}
