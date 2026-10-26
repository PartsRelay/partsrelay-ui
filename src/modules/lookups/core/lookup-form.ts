import { z } from 'zod'
import type { PostApiV1LookupsBody } from '@/core/api/models'
import { fieldErrors } from '@/core/errors'

export const identifiers = ['plate', 'vin'] as const

export type Identifier = (typeof identifiers)[number]

export type LookupPrefill = { plate?: string; vin?: string; query?: string }

export type LookupValues = { by: Identifier; identifier: string; query: string }

const PATTERNS: Record<Identifier, RegExp> = {
  plate: /^[A-Z0-9]{4,8}$/,
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,
}

export const QUERY_LENGTH = { min: 2, max: 200 }

export function emptyLookup({ plate, vin, query = '' }: LookupPrefill = {}): LookupValues {
  return vin && !plate
    ? { by: 'vin', identifier: vin, query }
    : { by: 'plate', identifier: plate ?? '', query }
}

export function compactIdentifier(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, '')
}

const identifierSchema = (by: Identifier) =>
  z
    .string()
    .trim()
    .min(1, `lookups.new.errors.${by}-required`)
    .transform(compactIdentifier)
    .pipe(z.string().regex(PATTERNS[by], `lookups.new.errors.${by}`))

export const identifierSchemas = { plate: identifierSchema('plate'), vin: identifierSchema('vin') }

export const querySchema = z
  .string()
  .trim()
  .min(1, { error: 'lookups.new.errors.query-required', abort: true })
  .min(QUERY_LENGTH.min, 'lookups.new.errors.query')
  .max(QUERY_LENGTH.max, 'lookups.new.errors.query')

export function newLookup({ by, identifier, query }: LookupValues): PostApiV1LookupsBody {
  return { [by]: compactIdentifier(identifier), query: query.trim() }
}

export function lookupFieldErrors(error: unknown) {
  const fields = fieldErrors(error, {
    plate: 'lookups.new.errors.plate',
    vin: 'lookups.new.errors.vin',
    query: 'lookups.new.errors.query',
  })

  return fields && { identifier: fields.plate ?? fields.vin, query: fields.query }
}
