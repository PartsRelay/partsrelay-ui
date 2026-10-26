import type {
  CatalogUnit,
  LookupCategory,
  LookupObject,
  LookupObjectStatus,
  OemPart,
} from '@/core/api/models'
import { type Message, message } from '@/core/message'
import { type LookupRow, lookupRow, textKey } from '@/modules/lookups/core/lookup-row'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export type LookupState = Exclude<LookupObjectStatus, 'done'> | 'results' | 'unavailable'

const NO_PRICE = '-'

export type PartView = {
  code: string
  name: string | null
  price: string
  aftermarket: { code: string; brand: string | null; description: string | null; price: string }[]
}

export type UnitView = {
  key: string
  code: string | null
  name: string | null
  imageUrl: string | null
  parts: PartView[]
}

export type CategoryView = {
  id: string
  name: string
  units: UnitView[]
  counts: { original: number; aftermarket: number }
}

export type LookupDetail = LookupRow & {
  vin: string | null
  state: LookupState
  announcement: Message
  categories: CategoryView[]
}

export function lookupState(lookup: LookupObject): LookupState {
  if (lookup.status !== 'done') return lookup.status

  return lookup.categories ? 'results' : 'unavailable'
}

function priceOf(price: number | null, locale: string) {
  if (price === null) return NO_PRICE

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function partView(part: OemPart, locale: string): PartView {
  return {
    code: part.code,
    name: part.name,
    price: priceOf(part.price, locale),
    aftermarket: part.aftermarket.map((item) => ({
      code: item.code,
      brand: item.brand,
      description: item.description,
      price: priceOf(item.price, locale),
    })),
  }
}

function unitView(unit: CatalogUnit, key: string, locale: string): UnitView {
  return {
    key,
    code: unit.code,
    name: unit.name,
    imageUrl: unit.imageUrl,
    parts: unit.original.map((part) => partView(part, locale)),
  }
}

function categoryView(category: LookupCategory, locale: string): CategoryView {
  const units = category.units.map((unit, index) =>
    unitView(unit, `${category.id}:${index}`, locale)
  )
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

export function lookupDetail(
  lookup: LookupObject,
  workspace: Workspace,
  locale: string
): LookupDetail {
  const state = lookupState(lookup)

  return {
    ...lookupRow(lookup, workspace, locale),
    vin: lookup.vin,
    state,
    announcement: message(`lookups.outcome.${textKey(state)}.title`),
    categories: (lookup.categories ?? []).map((category) => categoryView(category, locale)),
  }
}
