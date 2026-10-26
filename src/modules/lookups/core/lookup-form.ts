import { z } from 'zod'
import type { PostApiV1LookupsBody } from '@/core/api/models'

export type LookupValues = { plate: string; query: string }

const PLATE = /^[A-Z0-9]{4,8}$/

export const QUERY_LENGTH = { min: 2, max: 200 }

export function emptyLookup(plate = ''): LookupValues {
  return { plate, query: '' }
}

export function compactPlate(plate: string) {
  return plate
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, '')
}

export const plateSchema = z
  .string()
  .trim()
  .min(1, 'lookups.new.errors.plate-required')
  .transform(compactPlate)
  .pipe(z.string().regex(PLATE, 'lookups.new.errors.plate'))

export const querySchema = z
  .string()
  .trim()
  .min(1, { error: 'lookups.new.errors.query-required', abort: true })
  .min(QUERY_LENGTH.min, 'lookups.new.errors.query')
  .max(QUERY_LENGTH.max, 'lookups.new.errors.query')

export function newLookup({ plate, query }: LookupValues): PostApiV1LookupsBody {
  return { plate: compactPlate(plate), query: query.trim() }
}

export const lookupFieldErrors = {
  plate: 'lookups.new.errors.plate',
  query: 'lookups.new.errors.query',
}
