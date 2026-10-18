import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  createOrganizationInvitation,
  getFullOrganization,
  postOrganizationRemoveMember,
  updateOrganizationMemberRole,
} from '@/core/api/auth/endpoints/organization/organization'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { resolveNotice } from '@/core/notice'
import {
  changeRoleMutation,
  inviteMutation,
  removeMemberMutation,
  transferOwnershipMutation,
} from '@/modules/workspaces/core/team.mutation'
import { authError, companyFixture, organizationFixture } from '@/core/testing/fixtures'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

vi.mock('@/core/api/auth/endpoints/organization/organization', async (original) => ({
  ...(await original()),
  getFullOrganization: vi.fn(),
  updateOrganizationMemberRole: vi.fn(),
  postOrganizationRemoveMember: vi.fn(),
  createOrganizationInvitation: vi.fn(),
}))

const organization = {
  getFullOrganization: vi.mocked(getFullOrganization),
  updateMemberRole: vi.mocked(updateOrganizationMemberRole),
  removeMember: vi.mocked(postOrganizationRemoveMember),
  inviteMember: vi.mocked(createOrganizationInvitation),
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(workspaceKey, organizationFixture())
  const roleOf = (id: string) =>
    client.getQueryData(workspaceKey)!.members.find((item) => item.id === id)?.role

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
    client.setQueryData(sessionQuery.queryKey, { user: { id: '101' } } as never)
    organization.updateMemberRole.mockResolvedValue({} as never)
    organization.getFullOrganization.mockReturnValue(new Promise(() => {}) as never)
    const giulia = companyFixture().members[2]!

    await new MutationObserver(client, transferOwnershipMutation).mutate(giulia)

    expect(organization.updateMemberRole).toHaveBeenCalledWith({ memberId: '2', role: 'owner' })
    expect(client.getQueryState(sessionQuery.queryKey)?.isInvalidated).toBe(true)
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
    expect(client.getQueryState(workspaceKey)?.isInvalidated).toBe(true)
  })
})
