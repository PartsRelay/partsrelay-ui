import { toDate } from 'date-fns'
import { errorCode, errorKey, errorMessage, errorStatus } from '@/core/errors'
import { type Message, message } from '@/core/message'
import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export type InvitationDetails = {
  workspace: string
  inviter: string
  role: Role
  roleLabel: Message
  expiresAt: Date
}

export type InvitationView =
  | { state: 'loading' }
  | { state: 'failed'; reason: Message }
  | { state: 'unavailable'; reason: Message }
  | { state: 'signIn' }
  | { state: 'otherAccount' }
  | { state: 'ready'; details: InvitationDetails; confirm: boolean }

type Invitation = {
  organizationId: string
  organizationName: string
  inviterEmail: string
  role: string
  expiresAt: Date | string
}

type Company = Pick<Workspace, 'id' | 'members' | 'setup'>

const NOT_RECIPIENT = 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION'

const INVITER_GONE = 'INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION'

const expired: InvitationView = {
  state: 'unavailable',
  reason: message('invitation.unavailable.expired'),
}

function details(invitation: Invitation): InvitationDetails {
  const role = toRole(invitation.role)

  return {
    workspace: invitation.organizationName,
    inviter: invitation.inviterEmail,
    role,
    roleLabel: roleLabel(role),
    expiresAt: toDate(invitation.expiresAt),
  }
}

function unavailable(error: unknown): InvitationView {
  const code = errorCode(error)
  if (code === NOT_RECIPIENT) return { state: 'otherAccount' }
  if (code === INVITER_GONE) return { state: 'unavailable', reason: errorMessage(error) }

  if (errorStatus(error) === 400) return expired

  return { state: 'failed', reason: errorMessage(error) }
}

function joinable(
  invitation: Invitation,
  company: { data?: Company; error: unknown }
): InvitationView {
  if (company.error) return { state: 'failed', reason: errorMessage(company.error) }
  if (!company.data) return { state: 'loading' }

  if (company.data.id === invitation.organizationId) {
    return {
      state: 'unavailable',
      reason: message('invitation.unavailable.already-member', {
        workspace: invitation.organizationName,
      }),
    }
  }

  if (company.data.members.length > 1) {
    return { state: 'unavailable', reason: message('invitation.unavailable.company-not-empty') }
  }

  // A company never set up has nothing to lose
  return { state: 'ready', details: details(invitation), confirm: company.data.setup === 'done' }
}

export function invitationView({
  invitation,
  error,
  loading = false,
  signedIn,
  company,
}: {
  invitation: Invitation | undefined
  error: unknown
  loading?: boolean
  signedIn: boolean
  company: { data?: Company; error: unknown }
}): InvitationView {
  if (loading) return { state: 'loading' }
  if (!signedIn) return { state: 'signIn' }
  if (error) return unavailable(error)
  if (!invitation) return { state: 'loading' }

  return joinable(invitation, company)
}

export function invitationHeadline({ inviter, workspace }: InvitationDetails) {
  return message('invitation.headline', { inviter, workspace })
}

export function acceptError(error: unknown) {
  const code = errorCode(error)

  return code === 'WORKSPACE_NOT_RELEASABLE'
    ? message('invitation.unavailable.company-not-empty')
    : message(errorKey(code))
}
