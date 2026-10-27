import { describe, expect, it } from 'vite-plus/test'
import type { LookupStatsObject } from '@/core/api/models'
import { message } from '@/core/message'
import { greeting, statsView } from '@/modules/lookups/core/lookup-stats'

const stats = (overrides: Partial<LookupStatsObject> = {}): LookupStatsObject => ({
  days: 30,
  total: 112,
  done: 100,
  failed: 12,
  previousTotal: 100,
  topSearchers: [
    { searcher: { type: 'contact', id: 1, name: 'Oakfield Garage' }, total: 40 },
    { searcher: null, total: 20 },
    { searcher: { type: 'contact', id: 9, name: null }, total: 2 },
  ],
  ...overrides,
})

describe('operations desk', () => {
  it('greets by the time of day', () => {
    const at = (hour: number) => greeting('Mark', new Date(2026, 9, 26, hour))

    expect(at(8)).toEqual(message('lookups.greeting.morning', { name: 'Mark' }))
    expect(at(13)).toEqual(message('lookups.greeting.afternoon', { name: 'Mark' }))
    expect(at(20)).toEqual(message('lookups.greeting.evening', { name: 'Mark' }))
    expect(at(2)).toEqual(message('lookups.greeting.evening', { name: 'Mark' }))
  })

  it('counts the searches of the period against the previous one', () => {
    const [total, done, failed] = statsView(stats()).cards

    expect(total).toEqual({
      id: 'total',
      value: 112,
      label: message('lookups.stats.total', { days: 30 }),
      note: message('lookups.stats.change', { change: 112 / 100 - 1, days: 30 }),
    })
    expect(done).toMatchObject({ value: 100, note: message('lookups.stats.done-note') })
    expect(failed).toMatchObject({ value: 12, note: message('lookups.stats.failed-note') })
    expect(statsView(stats({ previousTotal: 0 })).cards[0]?.note).toEqual(
      message('lookups.stats.no-previous', { days: 30 })
    )
  })

  it('names the top searchers like the queue does', () => {
    const labels = statsView(stats()).topSearchers.map(({ label }) => label)

    expect(labels).toEqual([
      message('lookups.searcher.named', { name: 'Oakfield Garage' }),
      message('lookups.searcher.gone'),
      message('lookups.searcher.unnamed-contact'),
    ])
  })
})
