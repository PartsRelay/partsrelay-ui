import { describe, expect, it } from 'vite-plus/test'
import { profileView } from '@/modules/auth/core/profile'
import type { Role } from '@/modules/workspaces/core/role'
import { findMe, type Member, type Workspace } from '@/modules/workspaces/core/workspace'

const member = (id: string, name: string, email: string, role: Role): Member => ({
  id,
  userId: id,
  role,
  name,
  email,
  image: null,
  joinedAt: new Date('2026-01-12T09:00:00Z'),
})

const company: Workspace = {
  id: '1',
  name: 'Redwood Parts Ltd',
  locale: 'en-US',
  setup: 'done',
  metadata: {},
  members: [
    member('1', 'Mark Reed', 'mark.reed@redwoodparts.com', 'owner'),
    member('4', 'Sarah Collins', 'sarah.collins@redwoodparts.com', 'viewer'),
  ],
  invitations: [],
}

const viewOf = (userId: string) => {
  const me = findMe(company, userId)
  if (!me) throw new Error('Missing member')

  return profileView(me, company)
}

describe('profileView', () => {
  it('shows who I am and where I work', () => {
    expect(viewOf('4')).toEqual({
      name: 'Sarah Collins',
      email: 'sarah.collins@redwoodparts.com',
      image: null,
      company: 'Redwood Parts Ltd',
      roleLabel: ['roles.viewer'],
      canLeave: true,
    })
  })

  it('keeps the owner from leaving', () => {
    expect(viewOf('1')).toMatchObject({ roleLabel: ['roles.owner'], canLeave: false })
  })
})
