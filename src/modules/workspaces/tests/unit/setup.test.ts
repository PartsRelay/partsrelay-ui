import { addDays } from 'date-fns'
import { describe, expect, it } from 'vite-plus/test'
import { pendingInvitation, setupDefaults } from '@/modules/workspaces/core/setup'

const now = new Date('2026-10-21T10:00:00Z')

const redwoodParts = { name: 'Redwood Parts Ltd', locale: 'en-US', setup: 'done' } as const

const offer = (id: string, status: string, expiresInDays: number) => ({
  id,
  organizationName: 'Ironworks Garage Ltd',
  status,
  expiresAt: addDays(now, expiresInDays).toISOString(),
})

describe('pendingInvitation', () => {
  it('is null without invitations', () => {
    expect(pendingInvitation(undefined, now)).toBeNull()
    expect(pendingInvitation([], now)).toBeNull()
  })

  it('picks the first invitation still pending', () => {
    const invitations = [
      offer('30', 'pending', -1),
      offer('31', 'canceled', 5),
      offer('32', 'pending', 5),
      offer('33', 'pending', 6),
    ]

    expect(pendingInvitation(invitations, now)?.id).toBe('32')
  })

  it('ignores invitations expired or no longer pending', () => {
    expect(pendingInvitation([offer('30', 'pending', -1), offer('31', 'accepted', 5)], now)).toBe(
      null
    )
  })
})

describe('setupDefaults', () => {
  it('starts a pending company empty, in the browser language', () => {
    const pending = { ...redwoodParts, setup: 'pending' as const }

    expect(setupDefaults(pending, 'it-IT')).toEqual({ name: '', locale: 'it-IT', userName: '' })
  })

  it('keeps the name and language of a company already set up', () => {
    const company = { ...redwoodParts, locale: 'it-IT' as const }

    expect(setupDefaults(company, 'en-US')).toEqual({
      name: 'Redwood Parts Ltd',
      locale: 'it-IT',
      userName: '',
    })
  })
})
