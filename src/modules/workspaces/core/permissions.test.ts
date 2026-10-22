import { describe, expect, it } from 'vite-plus/test'
import { canManageRole, permissionsFor } from '@/modules/workspaces/core/permissions'
import { toRole } from '@/modules/workspaces/core/role'

describe('current core workspace permissions', () => {
  it('reserves company changes and ownership transfer for the owner', () => {
    expect(permissionsFor('owner')).toMatchObject({
      updateCompany: true,
      deleteCompany: true,
      transferOwnership: true,
      leaveCompany: false,
    })
    for (const role of ['admin', 'viewer'] as const) {
      expect(permissionsFor(role)).toMatchObject({
        updateCompany: false,
        deleteCompany: false,
        transferOwnership: false,
        leaveCompany: true,
      })
    }
  })
  it('prevents role escalation through UI capabilities', () => {
    expect(permissionsFor('admin').inviteRoles).toEqual(['viewer'])
    expect(permissionsFor('viewer').inviteRoles).toEqual([])
    expect(canManageRole('admin', 'owner')).toBe(false)
    expect(canManageRole('admin', 'admin')).toBe(false)
    expect(canManageRole('admin', 'viewer')).toBe(true)
  })
  it('defaults unknown roles to the least privileged role', () => {
    expect(toRole('unexpected')).toBe('viewer')
    expect(permissionsFor('viewer')).toMatchObject({
      viewTeam: false,
      viewCompany: false,
    })
  })
})
