import { addDays } from 'date-fns'
import { describe, expect, it } from 'vite-plus/test'
import type { Role } from '@/modules/workspaces/core/role'
import {
  findMe,
  type FullOrganization,
  invitationLink,
  invitationRows,
  type Me,
  memberRows,
  needsSetup,
  toWorkspace,
  transferAction,
  transferCandidates,
  withoutInvitation,
  withoutMember,
  type Workspace,
  workspaceSummary,
} from '@/modules/workspaces/core/workspace'

// Data like the dev mocks
const now = new Date('2026-10-21T10:00:00Z')

const origin = 'http://localhost:5173'

const day = (days: number) => addDays(now, days)

type Person = { id: string; name: string; email: string; image?: string }

const people = {
  mark: { id: '1', name: 'Mark Reed', email: 'mark.reed@redwoodparts.com' },
  julia: {
    id: '2',
    name: 'Julia Bennett',
    email: 'julia.bennett@redwoodparts.com',
    image: 'https://images.example/julia.png',
  },
  luke: { id: '3', name: 'Luke Foster', email: 'luke.foster@gmail.com' },
  sarah: { id: '4', name: 'Sarah Collins', email: 'sarah.collins@redwoodparts.com' },
} satisfies Record<string, Person>

function member(person: Person, role: Role, joinedDaysAgo: number) {
  return {
    id: `m${person.id}`,
    organizationId: '1',
    userId: person.id,
    role,
    createdAt: day(-joinedDaysAgo),
    user: person,
  }
}

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

function invitation(
  id: string,
  email: string,
  role: Role,
  sentDaysAgo: number,
  status: InvitationStatus = 'pending'
) {
  return {
    id,
    organizationId: '1',
    email,
    role,
    status,
    inviterId: people.mark.id,
    createdAt: day(-sentDaysAgo),
    expiresAt: day(7 - sentDaysAgo),
  }
}

function redwoodParts(): FullOrganization {
  return {
    id: '1',
    name: 'Redwood Parts Ltd',
    slug: 'redwood-parts',
    logo: null,
    metadata: '{"setup":"done"}',
    locale: 'en-US',
    createdAt: day(-400),
    // Sarah before Luke, the rows sort them by name
    members: [
      member(people.sarah, 'viewer', 31),
      member(people.julia, 'admin', 388),
      member(people.luke, 'viewer', 122),
      member(people.mark, 'owner', 400),
    ],
    invitations: [
      invitation('7', 'f.roberts@redwoodparts.com', 'viewer', 1),
      invitation('6', 'a.evans@redwoodparts.com', 'admin', 3),
      invitation('5', 'north.garage@gmail.com', 'viewer', 9),
      // Older rows the core keeps for the same addresses
      invitation('2', 'A.Evans@redwoodparts.com', 'viewer', 5, 'canceled'),
      invitation('8', 'm.baker@gmail.com', 'admin', 4),
      invitation('9', 'm.baker@gmail.com', 'admin', 2, 'rejected'),
      // Accepted, then invited again by mistake
      invitation('4', 'luke.foster@gmail.com', 'viewer', 125, 'accepted'),
      invitation('10', 'Luke.Foster@gmail.com', 'viewer', 2),
      invitation('3', 'p.green@redwoodparts.com', 'viewer', 40, 'canceled'),
    ],
  }
}

function workspace(): Workspace {
  return toWorkspace(redwoodParts())
}

function meAs(person: Person, from = workspace()): Me {
  const me = findMe(from, person.id)
  if (!me) throw new Error(`${person.name} is not a member`)

  return me
}

describe('toWorkspace', () => {
  it('maps the organization the core sends to the model', () => {
    const result = workspace()

    expect(result).toMatchObject({
      id: '1',
      name: 'Redwood Parts Ltd',
      locale: 'en-US',
      setup: 'done',
      metadata: { setup: 'done' },
    })
    expect(result.members.find(({ userId }) => userId === people.julia.id)).toEqual({
      id: 'm2',
      userId: '2',
      role: 'admin',
      name: 'Julia Bennett',
      email: 'julia.bennett@redwoodparts.com',
      image: 'https://images.example/julia.png',
      joinedAt: new Date('2025-09-28T10:00:00Z'),
    })
    expect(result.invitations[0]).toEqual({
      id: '7',
      email: 'f.roberts@redwoodparts.com',
      role: 'viewer',
      status: 'pending',
      createdAt: new Date('2026-10-20T10:00:00Z'),
      expiresAt: new Date('2026-10-27T10:00:00Z'),
    })
  })

  it('falls back for values the model does not know', () => {
    const organization = redwoodParts()
    organization.locale = 'fr-FR'
    organization.members[0].user = { id: '4', name: '', email: 'sarah.collins@redwoodparts.com' }
    const result = toWorkspace(organization)

    expect(result.locale).toBe('en-US')
    expect(result.members[0]).toMatchObject({ name: 'sarah.collins@redwoodparts.com', image: null })
  })

  it.each([
    ['{"setup":"pending"}', 'pending', { setup: 'pending' }],
    ['{"setup":"done","plan":"trial"}', 'done', { setup: 'done', plan: 'trial' }],
    ['not json', 'done', {}],
    ['[1,2]', 'done', {}],
    [undefined, 'done', {}],
  ])('reads the metadata %j', (metadata, setup, parsed) => {
    const result = toWorkspace({ ...redwoodParts(), metadata })

    expect(result.setup).toBe(setup)
    expect(result.metadata).toEqual(parsed)
  })
})

describe('findMe', () => {
  it('finds my membership and its permissions', () => {
    const me = findMe(workspace(), people.julia.id)

    expect(me?.member.name).toBe('Julia Bennett')
    expect(me?.role).toBe('admin')
    expect(me?.permissions.inviteRoles).toEqual(['viewer'])
  })

  it('is null for someone outside the company', () => {
    expect(findMe(workspace(), '99')).toBeNull()
  })
})

describe('needsSetup', () => {
  const pending = toWorkspace({ ...redwoodParts(), metadata: '{"setup":"pending"}' })

  it('sends only the owner of a pending company to the setup', () => {
    expect(needsSetup(pending, meAs(people.mark, pending))).toBe(true)
    expect(needsSetup(pending, meAs(people.julia, pending))).toBe(false)
    expect(needsSetup(workspace(), meAs(people.mark))).toBe(false)
  })
})

describe('memberRows', () => {
  it('lists the owner first, then admins and viewers by name', () => {
    const rows = memberRows(workspace(), meAs(people.mark))

    expect(rows.map(({ member }) => member.name)).toEqual([
      'Mark Reed',
      'Julia Bennett',
      'Luke Foster',
      'Sarah Collins',
    ])
    expect(rows.map(({ roleLabel }) => roleLabel)).toEqual([
      ['roles.owner'],
      ['roles.admin'],
      ['roles.viewer'],
      ['roles.viewer'],
    ])
  })

  it('lets the owner transfer ownership and remove everyone else', () => {
    const rows = memberRows(workspace(), meAs(people.mark))

    expect(rows.map(({ isMe, canTransfer, canRemove }) => [isMe, canTransfer, canRemove])).toEqual([
      [true, true, false],
      [false, false, true],
      [false, false, true],
      [false, false, true],
    ])
  })

  it('lets an admin remove only viewers', () => {
    const rows = memberRows(workspace(), meAs(people.julia))

    expect(rows.map(({ isMe, canTransfer, canRemove }) => [isMe, canTransfer, canRemove])).toEqual([
      [false, false, false],
      [true, false, false],
      [false, false, true],
      [false, false, true],
    ])
  })

  it('lets a viewer manage nobody', () => {
    const rows = memberRows(workspace(), meAs(people.sarah))

    expect(rows.some(({ canTransfer, canRemove }) => canTransfer || canRemove)).toBe(false)
  })
})

describe('transferCandidates', () => {
  it('offers every other member but the owner', () => {
    const names = transferCandidates(workspace(), meAs(people.mark)).map(({ name }) => name)

    expect(names).toEqual(['Julia Bennett', 'Luke Foster', 'Sarah Collins'])
  })
})

describe('transferAction', () => {
  it('names the chosen member', () => {
    const [julia] = transferCandidates(workspace(), meAs(people.mark))

    expect(transferAction()).toEqual(['workspace.transfer.title'])
    expect(transferAction(julia)).toEqual(['workspace.transfer.action', { name: 'Julia Bennett' }])
  })
})

describe('invitationRows', () => {
  it('shows the newest pending invitation per address, latest expiry first', () => {
    const rows = invitationRows(workspace(), meAs(people.mark), now, origin, 'en-US')

    expect(rows.map(({ invitation }) => invitation.email)).toEqual([
      'f.roberts@redwoodparts.com',
      'a.evans@redwoodparts.com',
      'north.garage@gmail.com',
    ])
  })

  it('skips addresses that are already members, in any case', () => {
    const rows = invitationRows(workspace(), meAs(people.mark), now, origin, 'en-US')

    expect(rows.some(({ invitation }) => /luke/i.test(invitation.email))).toBe(false)
  })

  it('marks expired invitations and builds their links', () => {
    const rows = invitationRows(workspace(), meAs(people.mark), now, origin, 'en-US')

    expect(rows.map(({ expired }) => expired)).toEqual([false, false, true])
    expect(rows[0]).toMatchObject({
      roleLabel: ['roles.viewer'],
      sent: 'Oct 20, 2026',
      link: 'http://localhost:5173/invitations/7',
      canManage: true,
    })
  })

  it('formats the date in the app language', () => {
    const [row] = invitationRows(workspace(), meAs(people.mark), now, origin, 'it-IT')

    expect(row.sent).toBe('20 ott 2026')
  })

  it('lets an admin manage only viewer invitations', () => {
    const rows = invitationRows(workspace(), meAs(people.julia), now, origin, 'en-US')

    expect(rows.map(({ invitation, canManage }) => [invitation.role, canManage])).toEqual([
      ['viewer', true],
      ['admin', false],
      ['viewer', true],
    ])
  })
})

describe('workspaceSummary', () => {
  it('counts members and invitations still waiting', () => {
    expect(workspaceSummary(workspace(), now)).toEqual([
      ['workspace.summary.members', { count: 4 }],
      ['workspace.summary.invitations', { count: 2 }],
    ])
  })
})

describe('invitationLink', () => {
  it('points to the invitation page of the app', () => {
    expect(invitationLink('31', 'https://app.example')).toBe('https://app.example/invitations/31')
  })
})

describe('optimistic updates', () => {
  it('removes a member without touching the cached organization', () => {
    const organization = redwoodParts()
    const next = withoutMember(organization, 'm3')

    expect(next.members.map(({ id }) => id)).toEqual(['m4', 'm2', 'm1'])
    expect(organization.members).toHaveLength(4)
  })

  it('removes an invitation without touching the cached organization', () => {
    const organization = redwoodParts()
    const next = withoutInvitation(organization, '7')

    expect(next.invitations.some(({ id }) => id === '7')).toBe(false)
    expect(next.invitations).toHaveLength(organization.invitations.length - 1)
  })
})
