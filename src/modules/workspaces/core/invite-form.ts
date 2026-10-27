import { errorCode, errorKey } from '@/core/errors'
import { message } from '@/core/message'
import type { Role } from '@/modules/workspaces/core/role'
import type { Me } from '@/modules/workspaces/core/workspace'

export type Invitee = { email: string; role: Role }

const INVITEE_CODES = [
  'invalid-email',
  'user-is-already-a-member-of-this-organization',
  'user-is-already-invited-to-this-organization',
]

export function roleHint(role: Role, me: Me) {
  if (me.role !== 'owner') return message('workspace.invite.hints.admin-invites-viewers')

  return message(`workspace.invite.hints.${role}`)
}

export function inviteDefaults(me: Me): Invitee {
  return { email: '', role: me.permissions.inviteRoles[0] ?? 'viewer' }
}

export function inviteeError(error: unknown) {
  return INVITEE_CODES.includes(errorCode(error)) ? errorKey(error) : null
}
