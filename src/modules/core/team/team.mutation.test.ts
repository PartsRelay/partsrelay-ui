import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/core/auth/auth.client'
import { resolveNotice } from '@/modules/core/shared/notice'
import {
  changeRoleMutation,
  inviteMutation,
  removeMemberMutation,
  transferOwnershipMutation,
} from '@/modules/core/team/team.mutation'
import { authError, companyFixture } from '@/modules/core/testing/fixtures'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

vi.mock('@/modules/core/auth/auth.client', () => ({
  authClient: {
    getSession: vi.fn(),
    organization: {
      getFullOrganization: vi.fn(),
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
      inviteMember: vi.fn(),
    },
  },
}))

const organization = vi.mocked(authClient.organization)

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(workspaceKeys.all, companyFixture())
  const roleOf = (id: string) =>
    client.getQueryData<Workspace>(workspaceKeys.all)!.members.find((item) => item.id === id)?.role

  return { client, roleOf }
}

beforeEach(() => vi.resetAllMocks())

describe('team mutations', () => {
  it('changes the role right away and keeps it', async () => {
    const { client, roleOf } = setup()
    let release = () => {}
    organization.updateMemberRole.mockReturnValue(
      new Promise((resolve) => (release = () => resolve({} as never))) as never
    )
    organization.getFullOrganization.mockReturnValue(new Promise(() => {}) as never)
    const luca = companyFixture().members[0]!
    const options = changeRoleMutation(luca)
    const done = new MutationObserver(client, options).mutate('admin')

    await vi.waitFor(() => expect(roleOf('3')).toBe('admin'))
    release()
    await done
    expect(organization.updateMemberRole).toHaveBeenCalledWith({ memberId: '3', role: 'admin' })
    expect(resolveNotice(options.meta, 'admin', undefined)).toEqual({
      key: 'team.notices.roleChanged.admin',
      values: { name: 'Luca Ferri' },
    })
  })

  it('rolls back when the core refuses', async () => {
    const { client, roleOf } = setup()
    organization.removeMember.mockRejectedValue(authError(403, 'WORKSPACE_ROLE_NOT_MANAGED'))
    organization.getFullOrganization.mockReturnValue(new Promise(() => {}) as never)
    const luca = companyFixture().members[0]!

    await expect(
      new MutationObserver(client, removeMemberMutation(luca)).mutate()
    ).rejects.toBeTruthy()
    expect(roleOf('3')).toBe('viewer')
  })

  it('hands the company to the chosen member and refreshes the session', async () => {
    const { client } = setup()
    client.setQueryData(['session'], { user: { id: '101' } })
    organization.updateMemberRole.mockResolvedValue({} as never)
    organization.getFullOrganization.mockReturnValue(new Promise(() => {}) as never)
    const giulia = companyFixture().members[2]!

    await new MutationObserver(client, transferOwnershipMutation).mutate(giulia)

    expect(organization.updateMemberRole).toHaveBeenCalledWith({ memberId: '2', role: 'owner' })
    expect(client.getQueryState(['session'])?.isInvalidated).toBe(true)
    expect(resolveNotice(transferOwnershipMutation.meta, giulia, undefined)).toEqual({
      key: 'team.notices.ownershipTransferred',
      values: { name: 'Giulia Bianchi' },
    })
  })

  it('refreshes the team when an invitation is refused', async () => {
    const { client } = setup()
    organization.inviteMember.mockRejectedValue(
      authError(400, 'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION')
    )

    await expect(
      new MutationObserver(client, inviteMutation).mutate({ email: 'luca@x.it', role: 'viewer' })
    ).rejects.toBeTruthy()
    expect(client.getQueryState(workspaceKeys.all)?.isInvalidated).toBe(true)
  })
})
