import { compareDesc, intlFormat, isAfter, toDate } from 'date-fns'
import { z } from 'zod'
import { type Message, message } from '@/core/message'
import { requiredText } from '@/core/schemas'
import type { authClient } from '@/modules/auth/core/auth.client'
import { type Locale, toLocale } from '@/modules/workspaces/core/locale'
import {
  canManageRole,
  type Permissions,
  permissionsFor,
} from '@/modules/workspaces/core/permissions'
import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'

export type FullOrganization = typeof authClient.$Infer.ActiveOrganization

export type Member = {
  id: string
  userId: string
  role: Role
  name: string
  email: string
  image: string | null
  joinedAt: Date
}

type Invitation = {
  id: string
  email: string
  role: Role
  status: string
  expiresAt: Date
  createdAt: Date
}

type Metadata = Record<string, unknown>

export type Workspace = {
  id: string
  name: string
  locale: Locale
  setup: 'pending' | 'done'
  metadata: Metadata
  members: Member[]
  invitations: Invitation[]
}

export type Me = {
  member: Member
  role: Role
  permissions: Permissions
}

const metadataSchema = z.record(z.string(), z.unknown()).catch({})

function readMetadata(metadata: unknown): Metadata {
  try {
    return metadataSchema.parse(typeof metadata === 'string' ? JSON.parse(metadata) : metadata)
  } catch {
    return {}
  }
}

export function toWorkspace(organization: FullOrganization): Workspace {
  const metadata = readMetadata(organization.metadata)

  return {
    id: organization.id,
    name: organization.name,
    locale: toLocale(organization.locale),
    setup: metadata.setup === 'pending' ? 'pending' : 'done',
    metadata,
    members: organization.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: toRole(member.role),
      name: member.user.name || member.user.email,
      email: member.user.email,
      image: member.user.image ?? null,
      joinedAt: toDate(member.createdAt),
    })),
    invitations: organization.invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: toRole(invitation.role),
      status: invitation.status,
      expiresAt: toDate(invitation.expiresAt),
      createdAt: toDate(invitation.createdAt),
    })),
  }
}

export function findMe(workspace: Workspace, userId: string): Me | null {
  const member = workspace.members.find((candidate) => candidate.userId === userId)
  if (!member) return null

  return {
    member,
    role: member.role,
    permissions: permissionsFor(member.role),
  }
}

export function needsSetup(workspace: Workspace, me: Me) {
  return me.role === 'owner' && workspace.setup === 'pending'
}

const ROLE_ORDER: Record<Role, number> = { owner: 0, admin: 1, viewer: 2 }

export const workspaceSearchSchema = z.object({
  transfer: z.boolean().optional().catch(undefined),
})

export type MemberRow = {
  member: Member
  isMe: boolean
  roleLabel: Message
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
    ? message('workspace.transfer.action', { name: candidate.name })
    : message('workspace.transfer.title')
}

export function workspaceSummary(workspace: Workspace, now: Date) {
  const waiting = pendingInvitations(workspace).filter(({ expiresAt }) => isAfter(expiresAt, now))

  return [
    message('workspace.summary.members', { count: workspace.members.length }),
    message('workspace.summary.invitations', { count: waiting.length }),
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
  locale: string
): InvitationRow[] {
  return pendingInvitations(workspace).map((invitation) => ({
    invitation,
    roleLabel: roleLabel(invitation.role),
    sent: intlFormat(invitation.createdAt, { dateStyle: 'medium' }, { locale }),
    expired: !isAfter(invitation.expiresAt, now),
    canManage: canManageRole(me.role, invitation.role),
    link: invitationLink(invitation.id, origin),
  }))
}

export function withoutMember(organization: FullOrganization, memberId: string) {
  return {
    ...organization,
    members: organization.members.filter((item) => item.id !== memberId),
  }
}

export function withoutInvitation(organization: FullOrganization, invitationId: string) {
  return {
    ...organization,
    invitations: organization.invitations.filter((item) => item.id !== invitationId),
  }
}

export const companyNameSchema = requiredText('company.errors.name-required')
