import { describe, expect, it } from 'vite-plus/test'
import { canManageRole, permissionsFor } from '@/modules/workspaces/core/permissions'

describe('permissionsFor', () => {
  it('lets the owner do everything but leave', () => {
    expect(permissionsFor('owner')).toEqual({
      manageContacts: true,
      viewWorkspace: true,
      viewCompany: true,
      inviteRoles: ['viewer', 'admin'],
      transferOwnership: true,
      updateCompany: true,
      deleteCompany: true,
      leaveCompany: false,
    })
  })

  it('lets an admin see the workspace and invite viewers', () => {
    expect(permissionsFor('admin')).toEqual({
      manageContacts: true,
      viewWorkspace: true,
      viewCompany: false,
      inviteRoles: ['viewer'],
      transferOwnership: false,
      updateCompany: false,
      deleteCompany: false,
      leaveCompany: true,
    })
  })

  it('lets a viewer only leave', () => {
    expect(permissionsFor('viewer')).toEqual({
      manageContacts: false,
      viewWorkspace: false,
      viewCompany: false,
      inviteRoles: [],
      transferOwnership: false,
      updateCompany: false,
      deleteCompany: false,
      leaveCompany: true,
    })
  })

  it('returns a new list of roles every time', () => {
    permissionsFor('owner').inviteRoles.pop()

    expect(permissionsFor('owner').inviteRoles).toEqual(['viewer', 'admin'])
  })
})

describe('canManageRole', () => {
  it.each([
    ['owner', 'owner', false],
    ['owner', 'admin', true],
    ['owner', 'viewer', true],
    ['admin', 'owner', false],
    ['admin', 'admin', false],
    ['admin', 'viewer', true],
    ['viewer', 'owner', false],
    ['viewer', 'admin', false],
    ['viewer', 'viewer', false],
  ] as const)('%s manages %s: %s', (actor, target, expected) => {
    expect(canManageRole(actor, target)).toBe(expected)
  })
})
