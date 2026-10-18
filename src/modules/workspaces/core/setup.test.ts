import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/auth/core/auth.client'
import { createSetupForm, pendingInvitation } from '@/modules/workspaces/core/setup'
import { completeSetupMutation } from '@/modules/workspaces/core/setup.mutation'
import { message } from '@/core/message'
import { NAME_MAX } from '@/core/name'
import { companyFixture } from '@/core/testing/fixtures'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKeys } from '@/modules/workspaces/core/workspace.query'

vi.mock('@/modules/auth/core/auth.client', () => ({
  authClient: { getSession: vi.fn(), updateUser: vi.fn(), organization: { update: vi.fn() } },
}))

const now = new Date(2026, 9, 15, 10, 42)
const pending = {
  ...companyFixture(),
  name: 'luca@gmail.com',
  locale: 'en' as const,
  setup: 'pending' as const,
}

beforeEach(() => vi.resetAllMocks())

describe('setup form', () => {
  it('starts empty in the browser language while the setup is pending', () => {
    const form = createSetupForm(pending, { askName: false, browserLocale: 'it' })

    expect(form.state).toMatchObject({ name: '', locale: 'it', userName: '' })
    expect(
      createSetupForm(companyFixture(), { askName: false, browserLocale: 'en' }).state
    ).toMatchObject({
      name: 'Ricambi Rossi S.r.l.',
      locale: 'it',
    })
  })

  it('asks for a company name that fits', () => {
    const form = createSetupForm(pending, { askName: false, browserLocale: 'en' })

    expect(form.actions.submit()).toBeNull()
    expect(form.state.errors.name).toEqual(message('setup.errors.nameRequired'))

    form.actions.setName('x'.repeat(NAME_MAX + 1))
    expect(form.state.errors.name).toBeNull()
    expect(form.actions.submit()).toBeNull()
    expect(form.state.errors.name).toEqual(message('validation.tooLong', { max: NAME_MAX }))

    form.actions.setName(' Ricambi Rossi S.r.l. ')
    form.actions.setLocale('it')
    expect(form.actions.submit()).toEqual({ name: 'Ricambi Rossi S.r.l.', locale: 'it' })
  })

  it('asks for the user name only when the account has none', () => {
    const form = createSetupForm(pending, { askName: true, browserLocale: 'en' })
    form.actions.setName('Officina Neri')

    expect(form.actions.submit()).toBeNull()
    expect(form.state.errors).toEqual({
      name: null,
      userName: message('setup.errors.userNameRequired'),
    })

    form.actions.setUserName(' Giovanni Neri ')
    expect(form.state.errors.userName).toBeNull()
    expect(form.actions.submit()).toEqual({
      name: 'Officina Neri',
      locale: 'en',
      userName: 'Giovanni Neri',
    })
  })

  it('finds an invitation that can still be accepted', () => {
    const invitation = (id: string, status: string, expiresAt: string) => ({
      id,
      organizationName: 'Officina Ferri S.r.l.',
      status,
      expiresAt,
    })

    expect(pendingInvitation(undefined, now)).toBeNull()
    expect(
      pendingInvitation(
        [
          invitation('1', 'pending', '2026-10-01T10:00:00Z'),
          invitation('2', 'canceled', '2026-10-30T10:00:00Z'),
          invitation('3', 'pending', '2026-10-20T10:00:00Z'),
        ],
        now
      )?.id
    ).toBe('3')
  })
})

describe('completing the setup', () => {
  const workspace = { ...pending, metadata: { setup: 'pending', plan: 'pro' } }

  it('names the company, sets its language and keeps the other metadata', async () => {
    const client = new QueryClient()
    client.setQueryData<Workspace>(workspaceKeys.all, workspace)
    vi.mocked(authClient.organization.update).mockResolvedValue({} as never)

    await new MutationObserver(client, completeSetupMutation(workspace)).mutate({
      name: 'Officina Neri',
      locale: 'it',
    })

    expect(authClient.updateUser).not.toHaveBeenCalled()
    expect(authClient.organization.update).toHaveBeenCalledWith({
      data: {
        name: 'Officina Neri',
        locale: 'it',
        metadata: { setup: 'done', plan: 'pro' },
      },
    })
    expect(client.getQueryData<Workspace>(workspaceKeys.all)).toMatchObject({
      name: 'Officina Neri',
      locale: 'it',
      setup: 'done',
    })
  })

  it('saves the user name before closing the setup', async () => {
    const client = new QueryClient()
    vi.mocked(authClient.updateUser).mockResolvedValue({ status: true } as never)
    vi.mocked(authClient.organization.update).mockResolvedValue({} as never)

    await new MutationObserver(client, completeSetupMutation(workspace)).mutate({
      name: 'Officina Neri',
      locale: 'en',
      userName: 'Giovanni Neri',
    })

    expect(authClient.updateUser).toHaveBeenCalledWith({ name: 'Giovanni Neri' })
    expect(vi.mocked(authClient.updateUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(authClient.organization.update).mock.invocationCallOrder[0]!
    )
  })
})
