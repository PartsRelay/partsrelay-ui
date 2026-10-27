import { getHours } from 'date-fns'
import type { LookupStatsObject } from '@/core/api/models'
import { message } from '@/core/message'
import { searcherName } from '@/modules/lookups/core/lookup-row'

export function greeting(name: string, now: Date) {
  const hour = getHours(now)
  const part =
    hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening'

  return message(`lookups.greeting.${part}`, { name })
}

function changeNote({ days, total, previousTotal }: LookupStatsObject) {
  return previousTotal > 0
    ? message('lookups.stats.change', { change: total / previousTotal - 1, days })
    : message('lookups.stats.no-previous', { days })
}

export function statsView(stats: LookupStatsObject) {
  const { days } = stats

  return {
    days,
    cards: [
      { id: 'total', value: stats.total, note: changeNote(stats) },
      { id: 'done', value: stats.done, note: message('lookups.stats.done-note') },
      { id: 'failed', value: stats.failed, note: message('lookups.stats.failed-note') },
    ].map((card) => ({ ...card, label: message(`lookups.stats.${card.id}`, { days }) })),
    topSearchers: stats.topSearchers.map((top) => ({ ...top, label: searcherName(top.searcher) })),
  }
}
