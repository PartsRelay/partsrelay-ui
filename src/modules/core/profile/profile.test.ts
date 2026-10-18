import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import {
  createUserNameForm,
  leaveCompanyConfirm,
  profileView,
} from '@/modules/core/profile/profile'
import { leaveCompanyMutation, updateNameMutation } from '@/modules/core/profile/profile.mutation'
import { errorMessage } from '@/modules/core/shared/errors'
import { message } from '@/modules/core/shared/message'
import { resolveNotice } from '@/modules/core/shared/notice'
import { authError, companyFixture, meIn } from '@/modules/core/testing/fixtures'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

vi.mock('@/modules/core/auth/auth.client', () => ({
  authClient: { getSession: vi.fn(), updateUser: vi.fn(), organization: { leave: vi.fn() } },
}))

const leave = vi.mocked(authClient.organization.leave)

beforeEach(() => vi.resetAllMocks())

describe('profile', () => {
  it('shows the identity and lets only non owners leave', () => {
    const workspace = companyFixture()

    expect(profileView(meIn(workspace, '101'), workspace)).toEqual({
      name: 'Marco Rossi',
      email: 'marco@ricambirossi.it',
      image: null,
      company: 'Ricambi Rossi S.r.l.',
      roleLabel: message('roles.owner'),
      canLeave: false,
    })
    expect(profileView(meIn(workspace, '103'), workspace)).toMatchObject({
      canLeave: true,
      roleLabel: message('roles.viewer'),
    })
  })

  it('edits the name', () => {
    const form = createUserNameForm('')

    expect(form.actions.submit('')).toBeNull()
    expect(form.state.error).toEqual(message('profile.errors.nameRequired'))

    form.actions.change(' Luca Ferri ')
    expect(form.actions.submit('')).toBe('Luca Ferri')
  })

  it('says that leaving deletes the account', () => {
    const workspace = companyFixture()
    const spec = leaveCompanyConfirm(profileView(meIn(workspace, '103'), workspace))

    expect(spec).toMatchObject({
      title: message('profile.confirm.leave.title', { company: 'Ricambi Rossi S.r.l.' }),
      body: message('profile.confirm.leave.body'),
      tone: 'danger',
      acknowledge: message('profile.confirm.leave.acknowledge'),
    })
  })
})

describe('update name', () => {
  it('saves through Better Auth and refreshes the session and the team', async () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, { user: { id: '103', name: '' } })
    client.setQueryData(workspaceKeys.all, companyFixture())
    vi.mocked(authClient.updateUser).mockResolvedValue({ status: true } as never)

    await new MutationObserver(client, updateNameMutation).mutate('Luca Ferri')

    expect(authClient.updateUser).toHaveBeenCalledWith({ name: 'Luca Ferri' })
    expect(client.getQueryState(sessionQuery.queryKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(workspaceKeys.all)?.isInvalidated).toBe(true)
  })
})

describe('leave company', () => {
  it('ends the session once the core deletes the account', async () => {
    const client = new QueryClient()
    client.setQueryData(workspaceKeys.all, companyFixture())
    leave.mockResolvedValue({} as never)
    const options = leaveCompanyMutation(companyFixture())

    await new MutationObserver(client, options).mutate()

    expect(leave).toHaveBeenCalledWith({ organizationId: '1' })
    expect(client.getQueryData(workspaceKeys.all)).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
    expect(resolveNotice(options.meta, undefined, undefined)).toEqual(
      message('profile.notices.left', { company: 'Ricambi Rossi S.r.l.' })
    )
  })

  it('keeps the owner signed in when the core refuses', async () => {
    const client = new QueryClient()
    client.setQueryData(workspaceKeys.all, companyFixture())
    const refused = authError(400, 'YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER')
    leave.mockRejectedValue(refused)

    await expect(
      new MutationObserver(client, leaveCompanyMutation(companyFixture())).mutate()
    ).rejects.toBe(refused)

    expect(client.getQueryData(workspaceKeys.all)).toBeDefined()
    expect(errorMessage(refused)).toEqual(
      message('errors.YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER')
    )
  })
})
