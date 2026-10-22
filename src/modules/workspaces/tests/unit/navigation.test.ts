import { describe, expect, it } from 'vite-plus/test'
import {
  breadcrumbs,
  canOpen,
  homePath,
  navigation,
  ownerOf,
  pageAt,
} from '@/modules/workspaces/core/navigation'
import { permissionsFor } from '@/modules/workspaces/core/permissions'
import type { Role } from '@/modules/workspaces/core/role'
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

const owner = permissionsFor('owner')
const admin = permissionsFor('admin')
const viewer = permissionsFor('viewer')

describe('pageAt', () => {
  it.each([
    ['/workspace', 'workspace'],
    ['/workspace/', 'workspace'],
    ['/company', 'company'],
    ['/profile', 'profile'],
    ['/workspaces', null],
    ['/setup', null],
    ['/', null],
  ])('finds the page of %s', (pathname, page) => {
    expect(pageAt(pathname)).toBe(page)
  })
})

describe('canOpen', () => {
  it('opens the workspace to owners and admins only', () => {
    expect([owner, admin, viewer].map((permissions) => canOpen('workspace', permissions))).toEqual([
      true,
      true,
      false,
    ])
  })

  it('opens the company page to the owner only', () => {
    expect([owner, admin, viewer].map((permissions) => canOpen('company', permissions))).toEqual([
      true,
      false,
      false,
    ])
  })

  it('opens the profile and other pages to everyone', () => {
    expect(canOpen('profile', viewer)).toBe(true)
    expect(canOpen(null, viewer)).toBe(true)
  })
})

describe('homePath', () => {
  it('starts on the workspace, or on the profile without access to it', () => {
    expect(homePath(owner)).toBe('/workspace')
    expect(homePath(admin)).toBe('/workspace')
    expect(homePath(viewer)).toBe('/profile')
  })
})

describe('navigation', () => {
  it('lists the sections I can open and marks the current one', () => {
    expect(navigation(owner, 'company')).toEqual([
      { page: 'workspace', path: '/workspace', label: ['nav.workspace'], active: false },
      { page: 'company', path: '/company', label: ['nav.company'], active: true },
    ])
  })

  it('hides the sections I cannot open', () => {
    expect(navigation(admin, 'profile').map(({ page }) => page)).toEqual(['workspace'])
    expect(navigation(viewer, 'profile')).toEqual([])
  })
})

describe('breadcrumbs', () => {
  it('puts the workspace at the top of its own trail', () => {
    expect(breadcrumbs('workspace')).toEqual([['crumbs.workspace']])
    expect(breadcrumbs('company')).toEqual([['crumbs.workspace'], ['crumbs.company']])
  })

  it('puts the profile under the account', () => {
    expect(breadcrumbs('profile')).toEqual([['crumbs.account'], ['crumbs.profile']])
  })
})

describe('ownerOf', () => {
  it('finds the owner, if any', () => {
    const company = workspace()

    expect(ownerOf(company)?.name).toBe('Mark Reed')
    expect(
      ownerOf({ ...company, members: company.members.filter(({ role }) => role !== 'owner') })
    ).toBeNull()
  })
})
