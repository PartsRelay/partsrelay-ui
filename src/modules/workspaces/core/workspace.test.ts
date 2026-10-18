import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/core/message'
import { companyFixture, meIn } from '@/core/testing/fixtures'
import { preferredLocale, toLocale } from '@/modules/workspaces/core/locale'
import {
  breadcrumbs,
  canOpen,
  homePath,
  navigation,
  ownerOf,
  pageAt,
} from '@/modules/workspaces/core/navigation'
import { canManageRole, permissionsFor } from '@/modules/workspaces/core/permissions'
import { type FullOrganization, needsSetup, toWorkspace } from '@/modules/workspaces/core/workspace'

describe('permissions', () => {
  it('follows the core rules for each role', () => {
    expect(permissionsFor('owner')).toEqual({
      viewTeam: true,
      viewCompany: true,
      inviteRoles: ['viewer', 'admin'],
      changeRoles: true,
      transferOwnership: true,
      updateCompany: true,
      deleteCompany: true,
      leaveCompany: false,
    })
    expect(permissionsFor('admin')).toEqual({
      viewTeam: true,
      viewCompany: false,
      inviteRoles: ['viewer'],
      changeRoles: false,
      transferOwnership: false,
      updateCompany: false,
      deleteCompany: false,
      leaveCompany: true,
    })
    expect(permissionsFor('viewer')).toMatchObject({
      viewTeam: false,
      viewCompany: false,
      inviteRoles: [],
      leaveCompany: true,
    })
  })

  it('lets owners manage admins and viewers, admins only viewers', () => {
    expect(canManageRole('owner', 'admin')).toBe(true)
    expect(canManageRole('owner', 'owner')).toBe(false)
    expect(canManageRole('admin', 'viewer')).toBe(true)
    expect(canManageRole('admin', 'admin')).toBe(false)
    expect(canManageRole('viewer', 'viewer')).toBe(false)
  })
})

describe('navigation', () => {
  const permissionsOf = (userId: string) => meIn(companyFixture(), userId).permissions

  it('lists the sections a role can open', () => {
    const sectionsOf = (userId: string) =>
      navigation(permissionsOf(userId), null).map((item) => item.page)

    expect(sectionsOf('101')).toEqual(['team', 'company'])
    expect(sectionsOf('102')).toEqual(['team'])
    expect(sectionsOf('103')).toEqual([])
  })

  it('links, labels and marks the current section', () => {
    expect(navigation(permissionsOf('101'), 'company')).toEqual([
      { page: 'team', path: '/team', label: message('nav.team'), active: false },
      { page: 'company', path: '/company', label: message('nav.company'), active: true },
    ])
  })

  it('reads the page from the path', () => {
    expect(pageAt('/team')).toBe('team')
    expect(pageAt('/company/')).toBe('company')
    expect(pageAt('/profile')).toBe('profile')
    expect(pageAt('/teams')).toBeNull()
    expect(pageAt('/')).toBeNull()
  })

  it('opens team and company only with the permission', () => {
    expect(canOpen('team', permissionsOf('102'))).toBe(true)
    expect(canOpen('team', permissionsOf('103'))).toBe(false)
    expect(canOpen('company', permissionsOf('102'))).toBe(false)
    expect(canOpen('company', permissionsOf('101'))).toBe(true)
    expect(canOpen('profile', permissionsOf('103'))).toBe(true)
    expect(canOpen(null, permissionsOf('103'))).toBe(true)
  })

  it('starts managers on the team and viewers on their profile', () => {
    expect(homePath(permissionsOf('101'))).toBe('/team')
    expect(homePath(permissionsOf('102'))).toBe('/team')
    expect(homePath(permissionsOf('103'))).toBe('/profile')
  })

  it('builds the breadcrumb of every page', () => {
    expect(breadcrumbs('team')).toEqual([message('crumbs.workspace'), message('crumbs.team')])
    expect(breadcrumbs('company')).toEqual([message('crumbs.workspace'), message('crumbs.company')])
    expect(breadcrumbs('profile')).toEqual([message('crumbs.account'), message('crumbs.profile')])
  })

  it('finds the owner', () => {
    expect(ownerOf(companyFixture())?.name).toBe('Marco Rossi')
    expect(ownerOf({ ...companyFixture(), members: [] })).toBeNull()
  })
})

describe('locale', () => {
  it('keeps the supported languages only', () => {
    expect(toLocale('it')).toBe('it')
    expect(toLocale('de')).toBe('en')
    expect(toLocale(null)).toBe('en')
  })

  it('picks the first supported browser language', () => {
    expect(preferredLocale(['de-DE', 'it-IT', 'en-US'])).toBe('it')
    expect(preferredLocale(['en-GB', 'it'])).toBe('en')
    expect(preferredLocale(['fr-FR'])).toBe('en')
    expect(preferredLocale([])).toBe('en')
  })
})

describe('workspace', () => {
  const organization: FullOrganization = {
    id: '7',
    name: 'Officina',
    locale: 'it',
    members: [
      {
        id: '1',
        role: 'owner',
        userId: '10',
        createdAt: '2026-10-01T08:00:00.000Z',
        user: { id: '10', email: 'a@b.it', name: '', image: undefined },
      },
    ],
    invitations: [
      {
        id: '5',
        email: 'c@d.it',
        role: 'unknown',
        status: 'pending',
        expiresAt: '2026-10-20T08:00:00.000Z',
      },
    ],
  }

  it('maps the Better Auth organization', () => {
    const workspace = toWorkspace(organization)

    expect(workspace).toMatchObject({ locale: 'it', setup: 'done', metadata: {} })
    expect(workspace.members[0]).toMatchObject({ name: 'a@b.it', image: null, role: 'owner' })
    expect(workspace.members[0]!.joinedAt).toBeInstanceOf(Date)
    expect(workspace.invitations[0]).toMatchObject({ role: 'viewer', createdAt: null })
    expect(toWorkspace({ ...organization, locale: 'fr' }).locale).toBe('en')
    expect(toWorkspace({ ...organization, locale: undefined }).locale).toBe('en')
  })

  it('reads the metadata as a JSON string or an object', () => {
    const read = (metadata: FullOrganization['metadata']) => {
      const { setup, metadata: kept } = toWorkspace({ ...organization, metadata })

      return { setup, kept }
    }

    expect(read('{"setup":"pending"}')).toEqual({ setup: 'pending', kept: { setup: 'pending' } })
    expect(read({ setup: 'pending', plan: 'pro' })).toEqual({
      setup: 'pending',
      kept: { setup: 'pending', plan: 'pro' },
    })
    expect(read('{"setup":"done","since":"2026-10-01T08:00:00.000Z"}')).toEqual({
      setup: 'done',
      kept: { setup: 'done', since: '2026-10-01T08:00:00.000Z' },
    })
    expect(read('{"plan":"pro"}').setup).toBe('done')
    expect(read('not json')).toEqual({ setup: 'done', kept: {} })
    expect(read('[1]')).toEqual({ setup: 'done', kept: {} })
    expect(read(null)).toEqual({ setup: 'done', kept: {} })
  })

  it('sends only the owner of a new company to the setup', () => {
    const pending = { ...companyFixture(), setup: 'pending' as const }
    const done = companyFixture()

    expect(needsSetup(pending, meIn(pending, '101'))).toBe(true)
    expect(needsSetup(pending, meIn(pending, '102'))).toBe(false)
    expect(needsSetup(done, meIn(done, '101'))).toBe(false)
  })

  it('finds the signed in member', () => {
    expect(meIn(companyFixture(), '101')).toMatchObject({
      role: 'owner',
      firstName: 'Marco',
      initials: 'MR',
    })
  })
})
