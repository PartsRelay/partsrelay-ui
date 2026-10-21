import { errorCode, errorKey } from '@/core/errors'
import { message } from '@/core/message'
import type { Role } from '@/modules/workspaces/core/role'
import type { Me } from '@/modules/workspaces/core/workspace'

export type Invitee = { email: string; role: Role }

// Errors about the address, shown under the email field
const INVITEE_CODES = [
  'INVALID_EMAIL',
  'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION',
  'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION',
]

export function roleHint(role: Role, me: Me) {
  if (me.role !== 'owner') return message('workspace.invite.hints.admin-invites-viewers')

  return message(`workspace.invite.hints.${role}`)
}

export function inviteDefaults(me: Me): Invitee {
  return { email: '', role: me.permissions.inviteRoles[0] ?? 'viewer' }
}

export function inviteeError(error: unknown) {
  const code = errorCode(error)

  return INVITEE_CODES.includes(code) ? errorKey(code) : null
}
