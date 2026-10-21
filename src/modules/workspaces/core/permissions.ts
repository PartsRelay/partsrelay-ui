import { roles } from '@/modules/workspaces/core/access'
import type { Role } from '@/modules/workspaces/core/role'

const MANAGES: Record<Role, Role[]> = { owner: ['admin', 'viewer'], admin: ['viewer'], viewer: [] }

export type Permissions = {
  viewWorkspace: boolean
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

type Request = Parameters<(typeof roles)[Role]['authorize']>[0]

// Better Auth access control, the same the core checks
function can(role: Role, request: Request) {
  return roles[role].authorize(request).success
}

export function permissionsFor(role: Role): Permissions {
  return {
    viewWorkspace: can(role, { invitation: ['create'] }),
    viewCompany: can(role, { organization: ['update'] }),
    inviteRoles: [...MANAGES[role]].reverse(),
    changeRoles: can(role, { member: ['update'] }),
    transferOwnership: can(role, { member: ['update'] }),
    updateCompany: can(role, { organization: ['update'] }),
    deleteCompany: can(role, { organization: ['delete'] }),
    // The only owner cannot leave
    leaveCompany: role !== 'owner',
  }
}
