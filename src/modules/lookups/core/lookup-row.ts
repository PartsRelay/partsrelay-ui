import { intlFormat } from 'date-fns'
import type { LookupObject, LookupObjectStatus, Searcher } from '@/core/api/models'
import { type Message, message } from '@/core/message'
import type { Workspace } from '@/modules/workspaces/core/workspace'

type LookupTone = 'success' | 'warning' | 'danger'

export type LookupRow = {
  lookup: LookupObject
  identifier: string
  part: string | null
  vehicle: string | null
  statusLabel: Message
  tone: LookupTone
  sourceLabel: Message
  searcher: string | Message
  requested: string
}

const TONES: Record<LookupObjectStatus, LookupTone> = {
  running: 'warning',
  done: 'success',
  vehicle_not_found: 'danger',
  not_matched: 'danger',
  failed: 'danger',
}

export function textKey(value: string) {
  return value.replaceAll('_', '-')
}

export function searcherName(searcher: Searcher | null, workspace: Workspace) {
  if (!searcher) return message('lookups.searcher.gone')
  if (searcher.type === 'contact') {
    return searcher.name ?? message('lookups.searcher.unnamed-contact')
  }

  const member = workspace.members.find(({ userId }) => userId === String(searcher.id))

  return searcher.name || member?.email || message('lookups.searcher.member')
}

function partsFound({ categories = [] }: LookupObject) {
  return categories.map(({ id, name }) => name ?? id).join(', ') || null
}

export function lookupRow(lookup: LookupObject, workspace: Workspace, locale: string): LookupRow {
  return {
    lookup,
    identifier: lookup.plate ?? lookup.vin ?? '',
    part: lookup.query ?? partsFound(lookup),
    vehicle: lookup.vehicleDescription ?? null,
    statusLabel: message(`lookups.status.${textKey(lookup.status)}`),
    tone: TONES[lookup.status],
    sourceLabel: message(`lookups.source.${lookup.source}`),
    searcher: searcherName(lookup.searcher ?? null, workspace),
    requested: intlFormat(
      lookup.createdAt,
      { dateStyle: 'medium', timeStyle: 'short' },
      { locale }
    ),
  }
}
