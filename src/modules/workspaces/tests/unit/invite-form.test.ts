import { describe, expect, it } from 'vite-plus/test'
import { inviteDefaults, inviteeError, roleHint } from '@/modules/workspaces/core/invite-form'
import { permissionsFor } from '@/modules/workspaces/core/permissions'
import type { Role } from '@/modules/workspaces/core/role'
import type { Me } from '@/modules/workspaces/core/workspace'

const meAs = (role: Role): Me => ({
  member: {
    id: 'm1',
    userId: '1',
    role,
    name: 'Member 1',
    email: 'member.1@redwoodparts.com',
    image: null,
    joinedAt: new Date('2025-09-28T10:00:00Z'),
  },
  role,
  permissions: permissionsFor(role),
})

// What the Better Auth client throws
const authError = (status: number, code: string) => ({ status, error: { code } })

describe('inviteDefaults', () => {
  it('starts empty with the lowest role I can invite', () => {
    expect(inviteDefaults(meAs('owner'))).toEqual({ email: '', role: 'viewer' })
    expect(inviteDefaults(meAs('admin'))).toEqual({ email: '', role: 'viewer' })
  })

  it('falls back to viewer when I cannot invite', () => {
    expect(inviteDefaults(meAs('viewer')).role).toBe('viewer')
  })
})

describe('roleHint', () => {
  it('describes the chosen role to the owner', () => {
    expect(roleHint('admin', meAs('owner'))).toEqual(['workspace.invite.hints.admin'])
    expect(roleHint('viewer', meAs('owner'))).toEqual(['workspace.invite.hints.viewer'])
  })

  it('tells an admin they invite viewers', () => {
    expect(roleHint('viewer', meAs('admin'))).toEqual([
      'workspace.invite.hints.admin-invites-viewers',
    ])
  })
})

describe('inviteeError', () => {
  it.each([
    ['INVALID_EMAIL', 'errors.invalid-email'],
    [
      'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION',
      'errors.user-is-already-a-member-of-this-organization',
    ],
    [
      'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION',
      'errors.user-is-already-invited-to-this-organization',
    ],
  ])('shows %s under the email field', (code, key) => {
    expect(inviteeError(authError(400, code))).toBe(key)
  })

  it('leaves other errors to the notice', () => {
    expect(inviteeError(authError(403, 'WORKSPACE_ROLE_NOT_MANAGED'))).toBeNull()
    expect(inviteeError(authError(500, 'INTERNAL_SERVER_ERROR'))).toBeNull()
    expect(inviteeError(new TypeError('Failed to fetch'))).toBeNull()
  })
})
