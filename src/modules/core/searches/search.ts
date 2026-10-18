import type {
  CatalogUnit,
  LookupCategory,
  LookupObject,
  Searcher as LookupSearcher,
  OemPart,
} from '@/core/api/models'
import { formatPrice, formatWhen, toDate } from '@/modules/core/shared/format'
import { message } from '@/modules/core/shared/message'
import type { Workspace } from '@/modules/core/workspace/workspace'

export type SearchStatus = LookupObject['status']

export type SearchSource = LookupObject['source']

export type SearcherType = LookupSearcher['type']

export type SearchTone = 'success' | 'warning' | 'danger'

export type Search = {
  id: number
  plate: string
  vin: string | null
  vehicle: string | null
  nodeIds: string[]
  status: SearchStatus
  source: SearchSource
  searcher: LookupSearcher | null
  categories: LookupCategory[] | null
  createdAt: Date
}

// Done searches without categories have details missing from the cache
export type SearchState = Exclude<SearchStatus, 'done'> | 'results' | 'unavailable'

const TONES: Record<SearchStatus, SearchTone> = {
  running: 'warning',
  done: 'success',
  vehicle_not_found: 'danger',
  not_matched: 'danger',
  failed: 'danger',
}

export function toSearch(lookup: LookupObject): Search {
  return {
    id: lookup.id,
    plate: lookup.plate,
    vin: lookup.vin,
    vehicle: lookup.vehicleDescription ?? null,
    nodeIds: lookup.nodeIds,
    status: lookup.status,
    source: lookup.source,
    searcher: lookup.searcher ?? null,
    categories: lookup.categories ?? null,
    createdAt: toDate(lookup.createdAt),
  }
}

export function searchState(search: Search): SearchState {
  if (search.status !== 'done') return search.status

  return search.categories ? 'results' : 'unavailable'
}

// Deleted members and contacts leave the searcher empty
export function searcherName(searcher: LookupSearcher | null, workspace: Workspace) {
  if (!searcher) return message('searches.searcher.gone')
  if (searcher.type === 'contact') {
    return searcher.name ?? message('searches.searcher.unnamedContact')
  }

  const member = workspace.members.find(({ userId }) => userId === String(searcher.id))

  return searcher.name || member?.email || message('searches.searcher.member')
}

function statusOf(search: Search) {
  return { statusLabel: message(`searches.status.${search.status}`), tone: TONES[search.status] }
}

export function searchRow(search: Search, workspace: Workspace, now: Date, locale?: string) {
  return {
    id: search.id,
    plate: search.plate,
    vehicle: search.vehicle,
    ...statusOf(search),
    sourceLabel: message(`searches.source.${search.source}`),
    searcher: searcherName(search.searcher, workspace),
    requested: formatWhen(search.createdAt, now, locale),
  }
}

export type SearchRow = ReturnType<typeof searchRow>

function partView(part: OemPart, locale?: string) {
  return {
    code: part.code,
    name: part.name,
    price: formatPrice(part.price, locale),
    aftermarket: part.aftermarket.map((item) => ({
      code: item.code,
      brand: item.brand,
      description: item.description,
      price: formatPrice(item.price, locale),
    })),
  }
}

export type PartView = ReturnType<typeof partView>

function unitView(unit: CatalogUnit, key: string, locale?: string) {
  return {
    key,
    code: unit.code,
    name: unit.name,
    imageUrl: unit.imageUrl,
    parts: unit.original.map((part) => partView(part, locale)),
  }
}

export type UnitView = ReturnType<typeof unitView>

export function categoryView(category: LookupCategory, locale?: string) {
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

export type CategoryView = ReturnType<typeof categoryView>

export function searchDetail(search: Search, workspace: Workspace, now: Date, locale?: string) {
  return {
    ...searchRow(search, workspace, now, locale),
    vin: search.vin,
    state: searchState(search),
    announcement: message(`searches.outcome.${searchState(search)}.title`),
    categories: (search.categories ?? []).map((category) => categoryView(category, locale)),
  }
}

export type SearchDetail = ReturnType<typeof searchDetail>
