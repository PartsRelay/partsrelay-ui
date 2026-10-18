import { z } from 'zod'
import type { FullOrganization } from '@/core/api/auth/models'
import { firstName, initials, toDate } from '@/core/format'
import { type Locale, toLocale } from '@/modules/workspaces/core/locale'
import { type Permissions, permissionsFor } from '@/modules/workspaces/core/permissions'
import { type Role, toRole } from '@/modules/workspaces/core/role'

export type { FullOrganization }

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
  createdAt: Date
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

// The core stores metadata as JSON text
function readMetadata(metadata: FullOrganization['metadata']): Metadata {
  try {
    return metadataSchema.parse(metadata ? JSON.parse(metadata) : {})
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
    firstName: firstName(member.name),
    initials: initials(member.name),
  }
}

export function needsSetup(workspace: Workspace, me: Me) {
  return me.role === 'owner' && workspace.setup === 'pending'
}
