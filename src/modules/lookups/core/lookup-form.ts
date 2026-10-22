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

export function plateError({ value }: { value: string }) {
  if (!value.trim()) return 'lookups.new.errors.plate-required'

  return PLATE.test(compactPlate(value)) ? undefined : 'lookups.new.errors.plate'
}

export function queryError({ value }: { value: string }) {
  const { length } = value.trim()
  if (length === 0) return 'lookups.new.errors.query-required'

  return length < QUERY_LENGTH.min || length > QUERY_LENGTH.max
    ? 'lookups.new.errors.query'
    : undefined
}

export function newLookup({ plate, query }: LookupValues): PostApiV1LookupsBody {
  return { plate: compactPlate(plate), query: query.trim() }
}

export const lookupFieldErrors = {
  plate: 'lookups.new.errors.plate',
  query: 'lookups.new.errors.query',
}
