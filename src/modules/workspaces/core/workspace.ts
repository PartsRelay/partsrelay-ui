import { parseJSON } from 'better-auth/client'
import { z } from 'zod'
import { firstName, initials, toDate } from '@/core/format'
import { type Locale, toLocale } from '@/modules/workspaces/core/locale'
import { type Permissions, permissionsFor } from '@/modules/workspaces/core/permissions'
import { type Role, toRole } from '@/modules/workspaces/core/role'

type DateLike = Date | string

export type FullOrganization = {
  id: string
  name: string
  locale?: string | null
  metadata?: string | Record<string, unknown> | null
  members: Array<{
    id: string
    role: string
    userId: string
    createdAt: DateLike
    user: { id: string; email: string; name: string; image?: string | null }
  }>
  invitations: Array<{
    id: string
    email: string
    role: string
    status: string
    expiresAt: DateLike
    createdAt?: DateLike | null
  }>
}

export type Member = {
  id: string
  userId: string
  role: Role
  name: string
  email: string
  image: string | null
  joinedAt: Date
}

export type Invitation = {
  id: string
  email: string
  role: Role
  status: string
  expiresAt: Date
  createdAt: Date | null
}

export type Metadata = Record<string, unknown>

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
  firstName: string
  initials: string
}

const metadataSchema = z.record(z.string(), z.unknown()).catch({})

function readMetadata(metadata: FullOrganization['metadata']): Metadata {
  return metadataSchema.parse(parseJSON(metadata, { strict: false, parseDates: false }))
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
      createdAt: invitation.createdAt ? toDate(invitation.createdAt) : null,
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
    firstName: firstName(member.name),
    initials: initials(member.name),
  }
}

export function needsSetup(workspace: Workspace, me: Me) {
  return me.role === 'owner' && workspace.setup === 'pending'
}
