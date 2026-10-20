import { compareDesc, isAfter } from 'date-fns'
import { z } from 'zod'
import type { ConfirmSpec } from '@/core/confirm'
import { formatDate } from '@/core/format'
import { type Message, message } from '@/core/message'
import { canManageRole } from '@/modules/workspaces/core/permissions'
import { type Role, roleLabel } from '@/modules/workspaces/core/role'
import type { Invitation, Me, Member, Workspace } from '@/modules/workspaces/core/workspace'

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, viewer: 2 }

export const teamSearchSchema = z.object({
  transfer: z.boolean().optional().catch(undefined),
})

export type MemberRow = {
  member: Member
  isMe: boolean
  roleLabel: Message
  roleOptions: Role[] | null
  canTransfer: boolean
  canRemove: boolean
}

export type InvitationRow = {
  invitation: Invitation
  roleLabel: Message
  sent: string
  expired: boolean
  canManage: boolean
  link: string
}

function byRole(members: Member[]) {
  return [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name)
  )
}

// Newest invitation per email decides, the core keeps old rows
function pendingInvitations(workspace: Workspace) {
  const newest = new Map<string, Invitation>()

  for (const invitation of workspace.invitations) {
    const email = invitation.email.toLowerCase()
    const current = newest.get(email)
    if (!current || isAfter(invitation.createdAt, current.createdAt)) newest.set(email, invitation)
  }

  const members = new Set(workspace.members.map(({ email }) => email.toLowerCase()))

  return [...newest.values()]
    .filter(({ status, email }) => status === 'pending' && !members.has(email.toLowerCase()))
    .sort((a, b) => compareDesc(a.expiresAt, b.expiresAt))
}

export function memberRows(workspace: Workspace, me: Me): MemberRow[] {
  return byRole(workspace.members).map((member) => {
    const isMe = member.id === me.member.id
    const isOwner = member.role === 'owner'

    return {
      member,
      isMe,
      roleLabel: roleLabel(member.role),
      roleOptions:
        me.permissions.changeRoles && !isMe && !isOwner ? me.permissions.inviteRoles : null,
      canTransfer: isOwner && me.permissions.transferOwnership,
      canRemove: !isMe && canManageRole(me.role, member.role),
    }
  })
}

export function transferCandidates(workspace: Workspace, me: Me) {
  return byRole(workspace.members).filter(
    (member) => member.id !== me.member.id && member.role !== 'owner'
  )
}

export function transferAction(candidate?: Member) {
  return candidate
    ? message('team.transfer.action', { name: candidate.name })
    : message('team.transfer.title')
}

export function teamSummary(workspace: Workspace, now: Date) {
  const waiting = pendingInvitations(workspace).filter(({ expiresAt }) => isAfter(expiresAt, now))

  return [
    message('team.summary.members', { count: workspace.members.length }),
    message('team.summary.invitations', { count: waiting.length }),
  ]
}

export function invitationLink(id: string, origin: string) {
  return new URL(`/invitations/${id}`, origin).href
}

export function invitationRows(
  workspace: Workspace,
  me: Me,
  now: Date,
  origin: string,
  locale?: string
): InvitationRow[] {
  return pendingInvitations(workspace).map((invitation) => ({
    invitation,
    roleLabel: roleLabel(invitation.role),
    sent: formatDate(invitation.createdAt, locale),
    expired: !isAfter(invitation.expiresAt, now),
    canManage: canManageRole(me.role, invitation.role),
    link: invitationLink(invitation.id, origin),
  }))
}

export function removeMemberConfirm(member: Member, workspace: Workspace): ConfirmSpec {
  return {
    title: message('team.confirm.remove.title', { name: member.name }),
    body: message('team.confirm.remove.body', { name: member.name, company: workspace.name }),
    action: message('team.confirm.remove.action'),
    tone: 'danger',
    facts: [
      { label: message('team.confirm.email'), value: member.email },
      { label: message('team.confirm.role'), value: roleLabel(member.role) },
    ],
  }
}

export function revokeConfirm(row: InvitationRow): ConfirmSpec {
  return {
    title: message('team.confirm.revoke.title', { email: row.invitation.email }),
    body: message('team.confirm.revoke.body'),
    action: message('team.confirm.revoke.action'),
    tone: 'danger',
    facts: [
      { label: message('team.confirm.role'), value: row.roleLabel },
      { label: message('team.confirm.sent'), value: row.sent },
    ],
  }
}
