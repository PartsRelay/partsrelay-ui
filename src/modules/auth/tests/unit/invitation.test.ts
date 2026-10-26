import { describe, expect, it } from 'vite-plus/test'
import { acceptError, invitationHeadline, invitationView } from '@/modules/auth/core/invitation'
import type { Member } from '@/modules/workspaces/core/workspace'

// What the Better Auth client throws
const authError = (status: number, code: string) => ({
  status,
  error: { code, status, message: 'Failed' },
})

const invitation = {
  organizationId: '3',
  organizationName: 'Ironworks Garage Ltd',
  inviterEmail: 's.hale@ironworksgarage.com',
  role: 'admin',
  expiresAt: '2026-10-28T10:00:00.000Z',
}

const member = (id: string): Member => ({
  id,
  userId: id,
  role: id === '10' ? 'owner' : 'viewer',
  name: `Member ${id}`,
  email: `member.${id}@gmail.com`,
  image: null,
  joinedAt: new Date('2026-10-01T10:00:00Z'),
})

// My current company, alone in it unless told otherwise
const company = ({
  id = '2',
  members = 1,
  setup = 'pending' as const,
}: { id?: string; members?: number; setup?: 'pending' | 'done' } = {}) => ({
  data: {
    id,
    setup,
    members: Array.from({ length: members }, (_, index) => member(`${10 + index}`)),
  },
  error: null,
})

const view = (overrides: Partial<Parameters<typeof invitationView>[0]> = {}) =>
  invitationView({ invitation, error: null, signedIn: true, company: company(), ...overrides })

describe('invitationView', () => {
  it('waits for the session and the invitation', () => {
    expect(view({ loading: true })).toEqual({ state: 'loading' })
    expect(view({ invitation: undefined })).toEqual({ state: 'loading' })
    expect(view({ company: { error: null } })).toEqual({ state: 'loading' })
  })

  it('asks to sign in first', () => {
    expect(view({ signedIn: false, error: authError(401, 'unauthorized') })).toEqual({
      state: 'signIn',
    })
  })

  it('tells the wrong account to switch', () => {
    const error = authError(403, 'you-are-not-the-recipient-of-the-invitation')

    expect(view({ invitation: undefined, error })).toEqual({ state: 'otherAccount' })
  })

  it('explains an invitation that can no longer be used', () => {
    expect(view({ invitation: undefined, error: authError(400, 'bad-request') })).toEqual({
      state: 'unavailable',
      reason: ['invitation.unavailable.expired'],
    })
    expect(
      view({
        invitation: undefined,
        error: authError(400, 'inviter-is-no-longer-a-member-of-the-organization'),
      })
    ).toEqual({
      state: 'unavailable',
      reason: ['errors.inviter-is-no-longer-a-member-of-the-organization'],
    })
  })

  it('fails on other errors, mine or the company ones', () => {
    expect(view({ invitation: undefined, error: new TypeError('Failed to fetch') })).toEqual({
      state: 'failed',
      reason: ['errors.network-error'],
    })
    expect(view({ company: { error: authError(500, 'internal-server-error') } })).toEqual({
      state: 'failed',
      reason: ['errors.internal-server-error'],
    })
  })

  it('stops me from joining my own company again', () => {
    expect(view({ company: company({ id: '3' }) })).toEqual({
      state: 'unavailable',
      reason: ['invitation.unavailable.already-member', { workspace: 'Ironworks Garage Ltd' }],
    })
  })

  it('stops me from leaving a company with other members', () => {
    expect(view({ company: company({ members: 2, setup: 'done' }) })).toEqual({
      state: 'unavailable',
      reason: ['invitation.unavailable.company-not-empty'],
    })
  })

  it('lets me join, confirming only when my company is set up', () => {
    const details = {
      workspace: 'Ironworks Garage Ltd',
      inviter: 's.hale@ironworksgarage.com',
      role: 'admin',
      roleLabel: ['roles.admin'],
      expiresAt: new Date('2026-10-28T10:00:00.000Z'),
    }

    expect(view()).toEqual({ state: 'ready', details, confirm: false })
    expect(view({ company: company({ setup: 'done' }) })).toEqual({
      state: 'ready',
      details,
      confirm: true,
    })
  })

  it('treats an unknown role as viewer', () => {
    const ready = view({ invitation: { ...invitation, role: 'member' } })

    expect(ready).toMatchObject({ details: { role: 'viewer', roleLabel: ['roles.viewer'] } })
  })
})

describe('invitationHeadline', () => {
  it('names who invited me and where', () => {
    const ready = view()
    if (ready.state !== 'ready') throw new Error('Expected a ready invitation')

    expect(invitationHeadline(ready.details)).toEqual([
      'invitation.headline',
      { inviter: 's.hale@ironworksgarage.com', workspace: 'Ironworks Garage Ltd' },
    ])
  })
})

describe('acceptError', () => {
  it('explains a company that cannot be left', () => {
    expect(acceptError(authError(403, 'workspace-not-releasable'))).toEqual([
      'invitation.unavailable.company-not-empty',
    ])
  })

  it('translates the other error codes', () => {
    expect(acceptError(authError(400, 'invitation-not-found'))).toEqual([
      'errors.invitation-not-found',
    ])
  })
})
