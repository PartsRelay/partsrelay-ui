import { kebabCase } from 'change-case'
import { intlFormat } from 'date-fns'
import type { LookupObject, LookupObjectStatus, Searcher } from '@/core/api/models'
import { type Message, message } from '@/core/message'

type LookupTone = 'success' | 'warning' | 'danger'

export type LookupRow = {
  lookup: LookupObject
  identifier: string
  part: string | null
  vehicle: string | null
  statusLabel: Message
  tone: LookupTone
  sourceLabel: Message
  searcher: Message
  requested: string
}

const TONES: Record<LookupObjectStatus, LookupTone> = {
  running: 'warning',
  done: 'success',
  vehicle_not_found: 'danger',
  not_matched: 'danger',
  failed: 'danger',
}

export const textKey = kebabCase

export function searcherName(searcher: Searcher | null) {
  if (searcher?.name) return message('lookups.searcher.named', { name: searcher.name })

  return message(searcher ? 'lookups.searcher.unnamed-contact' : 'lookups.searcher.gone')
}

function partsFound({ categories = [] }: LookupObject) {
  return categories.map(({ id, name }) => name ?? id).join(', ') || null
}

export function lookupRow(lookup: LookupObject, locale: string): LookupRow {
  return {
    lookup,
    identifier: lookup.plate ?? lookup.vin ?? '',
    part: lookup.query ?? partsFound(lookup),
    vehicle: lookup.vehicleDescription ?? null,
    statusLabel: message(`lookups.status.${textKey(lookup.status)}`),
    tone: TONES[lookup.status],
    sourceLabel: message(`lookups.source.${lookup.source}`),
    searcher: searcherName(lookup.searcher ?? null),
    requested: intlFormat(
      lookup.createdAt,
      { dateStyle: 'medium', timeStyle: 'short' },
      { locale }
    ),
  }
}
