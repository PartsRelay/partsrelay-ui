import { describe, expect, it } from 'vite-plus/test'
import type { Role } from '@/modules/workspaces/core/role'
import { accessHint } from '@/modules/workspaces/core/shell'
import type { Member, Workspace } from '@/modules/workspaces/core/workspace'

const member = (id: string, role: Role, name: string): Member => ({
  id: `m${id}`,
  userId: id,
  role,
  name,
  email: `member.${id}@redwoodparts.com`,
  image: null,
  joinedAt: new Date('2025-09-28T10:00:00Z'),
})

// Redwood Parts Ltd, with its owner and an admin
const workspace = (): Workspace => ({
  id: '1',
  name: 'Redwood Parts Ltd',
  locale: 'en-US',
  setup: 'done',
  metadata: { setup: 'done' },
  members: [member('2', 'admin', 'Julia Bennett'), member('1', 'owner', 'Mark Reed')],
  invitations: [],
})

describe('accessHint', () => {
  it('names the owner to ask for access', () => {
    expect(accessHint(workspace())).toEqual([
      'shell.access-denied.ask-owner',
      { owner: 'Mark Reed' },
    ])
  })

  it('asks any owner when none is known', () => {
    const company = workspace()
    const members = company.members.filter(({ role }) => role !== 'owner')

    expect(accessHint({ ...company, members })).toEqual(['shell.access-denied.ask-any-owner'])
  })
})
