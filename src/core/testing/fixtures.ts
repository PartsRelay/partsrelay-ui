import { AxiosError, AxiosHeaders } from 'axios'
import type { FullOrganization } from '@/core/api/auth/models'
import type { Invitation, Member, Workspace } from '@/modules/workspaces/core/workspace'
import { findMe, toWorkspace } from '@/modules/workspaces/core/workspace'

export function member(id: string, role: Member['role'], name: string): Member {
  return {
    id,
    userId: String(100 + Number(id)),
    role,
    name,
    email: `${name.split(' ')[0]!.toLowerCase()}@ricambirossi.it`,
    image: null,
    joinedAt: new Date('2026-01-12T09:00:00Z'),
  }
}

export function invitation(id: string, role: Invitation['role'], email: string, expiresAt: string) {
  return {
    id,
    email,
    role,
    status: 'pending',
    expiresAt: new Date(expiresAt),
    createdAt: new Date(new Date(expiresAt).getTime() - 7 * 86_400_000),
  } satisfies Invitation
}

const people = [
  { id: '3', role: 'viewer', name: 'Luca Ferri' },
  { id: '1', role: 'owner', name: 'Marco Rossi' },
  { id: '2', role: 'admin', name: 'Giulia Bianchi' },
] as const

// The organization as the core sends it
export function organizationFixture(): FullOrganization {
  return {
    id: '1',
    name: 'Ricambi Rossi S.r.l.',
    slug: 'ricambi-rossi',
    createdAt: '2026-01-12T09:00:00Z',
    locale: 'it',
    metadata: JSON.stringify({ setup: 'done' }),
    members: people.map(({ id, role, name }) => {
      const { userId, email } = member(id, role, name)

      return {
        id,
        organizationId: '1',
        userId,
        role,
        createdAt: '2026-01-12T09:00:00Z',
        user: { id: userId, name, email, image: null },
      }
    }),
    invitations: [
      invitation('i1', 'viewer', 'f.romano@ricambirossi.it', '2026-10-15T10:00:00Z'),
      invitation('i2', 'admin', 'officina.neri@gmail.com', '2026-10-06T10:00:00Z'),
    ].map((item) => ({
      ...item,
      organizationId: '1',
      inviterId: '101',
      role: item.role === 'owner' ? 'admin' : item.role,
      status: 'pending' as const,
      expiresAt: item.expiresAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

export function companyFixture(): Workspace {
  return toWorkspace(organizationFixture())
}

export function meIn(workspace: Workspace, userId: string) {
  const me = findMe(workspace, userId)
  if (!me) throw new Error(`No member ${userId}`)

  return me
}

export function axiosError(status?: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() }
  const response =
    status === undefined
      ? undefined
      : { status, statusText: '', headers: {}, config, data: data ?? {} }

  return new AxiosError('failed', 'ERR', config, null, response)
}

// Better Auth sends its code at the top of the body
export function authError(status: number, code?: string) {
  return axiosError(status, code ? { code, message: code } : { message: 'failed' })
}
