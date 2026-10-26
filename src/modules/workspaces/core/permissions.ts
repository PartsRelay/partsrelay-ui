import { roles } from '@/modules/workspaces/core/access'
import type { Role } from '@/modules/workspaces/core/role'

const MANAGES: Record<Role, Role[]> = { owner: ['admin', 'viewer'], admin: ['viewer'], viewer: [] }

export type Permissions = {
  manageContacts: boolean
  viewStats: boolean
  viewWorkspace: boolean
  viewCompany: boolean
  inviteRoles: Role[]
  transferOwnership: boolean
  updateCompany: boolean
  deleteCompany: boolean
  leaveCompany: boolean
}

export function canManageRole(actor: Role, target: Role) {
  return MANAGES[actor].includes(target)
}

type Request = Parameters<(typeof roles)[Role]['authorize']>[0]

function can(role: Role, request: Request) {
  return roles[role].authorize(request).success
}

export function permissionsFor(role: Role): Permissions {
  return {
    manageContacts: role !== 'viewer',
    viewStats: role === 'owner',
    viewWorkspace: can(role, { invitation: ['create'] }),
    viewCompany: can(role, { organization: ['update'] }),
    inviteRoles: [...MANAGES[role]].reverse(),
    transferOwnership: can(role, { member: ['update'] }),
    updateCompany: can(role, { organization: ['update'] }),
    deleteCompany: can(role, { organization: ['delete'] }),
    leaveCompany: role !== 'owner',
  }
}
