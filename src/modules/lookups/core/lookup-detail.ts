import type {
  CatalogUnit,
  LookupCategory,
  LookupObject,
  LookupObjectStatus,
  OemPart,
} from '@/core/api/models'
import { type Message, message } from '@/core/message'
import type { LookupPrefill } from '@/modules/lookups/core/lookup-form'
import { type LookupRow, lookupRow, textKey } from '@/modules/lookups/core/lookup-row'

export type LookupState = Exclude<LookupObjectStatus, 'done'> | 'results' | 'unavailable'

export type UnitView = {
  key: string
  code: string | null
  name: string | null
  imageUrl: string | null
  parts: OemPart[]
}

export type CategoryView = {
  id: string
  name: string
  units: UnitView[]
  counts: { original: number; aftermarket: number }
}

export type LookupDetail = LookupRow & {
  vin: string | null
  retry: LookupPrefill
  state: LookupState
  announcement: Message
  categories: CategoryView[]
}

export function lookupState(lookup: LookupObject): LookupState {
  if (lookup.status !== 'done') return lookup.status

  return lookup.categories ? 'results' : 'unavailable'
}

function unitView(unit: CatalogUnit, key: string): UnitView {
  return { key, code: unit.code, name: unit.name, imageUrl: unit.imageUrl, parts: unit.original }
}

function categoryView(category: LookupCategory): CategoryView {
  const units = category.units.map((unit, index) => unitView(unit, `${category.id}:${index}`))
  const parts = units.flatMap((unit) => unit.parts)

  return {
    id: category.id,
    name: category.name ?? category.id,
    units,
    counts: {
      original: parts.length,
      aftermarket: parts.reduce((total, part) => total + part.aftermarket.length, 0),
    },
  }
}

function retryOf({ plate, vin, query }: LookupObject): LookupPrefill {
  const identifier = plate ? { plate } : { vin: vin ?? undefined }

  return { ...identifier, query: query ?? undefined }
}

export function lookupDetail(lookup: LookupObject, locale: string): LookupDetail {
  const state = lookupState(lookup)

  return {
    ...lookupRow(lookup, locale),
    vin: lookup.vin,
    retry: retryOf(lookup),
    state,
    announcement: message(`lookups.outcome.${textKey(state)}.title`),
    categories: (lookup.categories ?? []).map(categoryView),
  }
}
