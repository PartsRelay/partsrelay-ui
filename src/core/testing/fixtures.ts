import { AxiosError, AxiosHeaders } from 'axios'
import type { Invitation, Member, Workspace } from '@/modules/workspaces/core/workspace'
import { findMe } from '@/modules/workspaces/core/workspace'

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

export function companyFixture(): Workspace {
  return {
    id: '1',
    name: 'Ricambi Rossi S.r.l.',
    locale: 'it',
    setup: 'done',
    metadata: { setup: 'done' },
    members: [
      member('3', 'viewer', 'Luca Ferri'),
      member('1', 'owner', 'Marco Rossi'),
      member('2', 'admin', 'Giulia Bianchi'),
    ],
    invitations: [
      invitation('i1', 'viewer', 'f.romano@ricambirossi.it', '2026-10-15T10:00:00Z'),
      invitation('i2', 'admin', 'officina.neri@gmail.com', '2026-10-06T10:00:00Z'),
    ],
  }
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

export function authError(status: number, code?: string) {
  return { status, statusText: '', error: code ? { code, message: code } : { message: 'failed' } }
}
