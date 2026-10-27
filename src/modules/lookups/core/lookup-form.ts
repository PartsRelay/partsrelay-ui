import { z } from 'zod'
import type { PostApiV1LookupsBody } from '@/core/api/models'
import { fieldErrors } from '@/core/errors'

export const identifiers = ['plate', 'vin'] as const

export type Identifier = (typeof identifiers)[number]

export type LookupPrefill = { plate?: string; vin?: string; query?: string }

export type LookupValues = { by: Identifier; plate: string; vin: string; query: string }

const PATTERNS: Record<Identifier, RegExp> = {
  plate: /^[A-Z0-9]{4,8}$/,
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,
}

export function emptyLookup({
  plate = '',
  vin = '',
  query = '',
}: LookupPrefill = {}): LookupValues {
  return { by: vin && !plate ? 'vin' : 'plate', plate, vin, query }
}

export const toIdentifier = (value: string) => z.enum(identifiers).safeParse(value).data

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
  .min(2, 'lookups.new.errors.query')

export function newLookup(values: LookupValues): PostApiV1LookupsBody {
  return { [values.by]: compactIdentifier(values[values.by]), query: values.query.trim() }
}

export function lookupFieldErrors(error: unknown) {
  return fieldErrors(error, {
    plate: 'lookups.new.errors.plate',
    vin: 'lookups.new.errors.vin',
    query: 'lookups.new.errors.query',
  })
}
