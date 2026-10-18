import type { Role } from '@/modules/workspaces/core/role'

const MANAGES: Record<Role, Role[]> = { owner: ['admin', 'viewer'], admin: ['viewer'], viewer: [] }

export type Permissions = {
  viewTeam: boolean
  viewCompany: boolean
  inviteRoles: Role[]
  changeRoles: boolean
  transferOwnership: boolean
  updateCompany: boolean
  deleteCompany: boolean
  leaveCompany: boolean
}

export function canManageRole(actor: Role, target: Role) {
  return MANAGES[actor].includes(target)
}

export function permissionsFor(role: Role): Permissions {
  const owner = role === 'owner'

  return {
    viewTeam: role !== 'viewer',
    viewCompany: owner,
    inviteRoles: [...MANAGES[role]].reverse(),
    changeRoles: owner,
    transferOwnership: owner,
    updateCompany: owner,
    deleteCompany: owner,
    leaveCompany: !owner,
  }
}
