import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/core/message'
import {
  breadcrumbs,
  canOpen,
  homePath,
  navigation,
  pageAt,
} from '@/modules/workspaces/core/navigation'
import { permissionsFor } from '@/modules/workspaces/core/permissions'

describe('contacts in the app shell', () => {
  it('lets owners and admins manage the contacts, like the core', () => {
    expect(permissionsFor('owner').manageContacts).toBe(true)
    expect(permissionsFor('admin').manageContacts).toBe(true)
    expect(permissionsFor('viewer').manageContacts).toBe(false)
  })

  it('lists the contacts first for every role', () => {
    const sectionsOf = (role: 'owner' | 'admin' | 'viewer') =>
      navigation(permissionsFor(role), null).map((item) => item.page)

    expect(sectionsOf('owner')).toEqual(['contacts', 'workspace', 'company'])
    expect(sectionsOf('admin')).toEqual(['contacts', 'workspace'])
    expect(sectionsOf('viewer')).toEqual(['contacts'])
    expect(navigation(permissionsFor('viewer'), 'contacts')).toEqual([
      { page: 'contacts', path: '/contacts', label: message('nav.contacts'), active: true },
    ])
  })

  it('opens the contacts at home for every role', () => {
    expect(pageAt('/contacts')).toBe('contacts')
    expect(canOpen('contacts', permissionsFor('viewer'))).toBe(true)
    expect(homePath(permissionsFor('owner'))).toBe('/contacts')
    expect(homePath(permissionsFor('viewer'))).toBe('/contacts')
  })

  it('puts the contacts at the top of their own trail', () => {
    expect(breadcrumbs('contacts')).toEqual([message('crumbs.contacts')])
  })
})
