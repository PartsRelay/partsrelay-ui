import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '@/modules/core/auth/auth.client'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { createCompanyNameForm, deleteCompanyConfirm } from '@/modules/core/company/company'
import {
  changeLanguageMutation,
  deleteCompanyMutation,
  renameCompanyMutation,
} from '@/modules/core/company/company.mutation'
import { canConfirm } from '@/modules/core/shared/confirm'
import { errorMessage } from '@/modules/core/shared/errors'
import { message } from '@/modules/core/shared/message'
import { NAME_MAX } from '@/modules/core/shared/name'
import { resolveNotice } from '@/modules/core/shared/notice'
import { authError, companyFixture } from '@/modules/core/testing/fixtures'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { workspaceKeys } from '@/modules/core/workspace/workspace.query'

vi.mock('@/modules/core/auth/auth.client', () => ({
  authClient: { getSession: vi.fn(), organization: { update: vi.fn(), delete: vi.fn() } },
}))

const update = vi.mocked(authClient.organization.update)

function cached() {
  const client = new QueryClient()
  client.setQueryData(workspaceKeys.all, companyFixture())

  return { client, workspace: () => client.getQueryData<Workspace>(workspaceKeys.all) }
}

beforeEach(() => vi.resetAllMocks())

describe('company name', () => {
  it('explains why a name cannot be saved', () => {
    const form = createCompanyNameForm('Ricambi Rossi S.r.l.')

    form.actions.change('  ')
    expect(form.actions.submit('Ricambi Rossi S.r.l.')).toBeNull()
    expect(form.state.error).toEqual(message('company.errors.nameRequired'))

    form.actions.change('x'.repeat(NAME_MAX + 1))
    expect(form.actions.submit('Ricambi Rossi S.r.l.')).toBeNull()
    expect(form.state.error).toEqual(message('validation.tooLong', { max: NAME_MAX }))
  })

  it('saves only a new name', () => {
    const form = createCompanyNameForm('Ricambi Rossi S.r.l.')

    form.actions.change('Ricambi Rossi S.r.l. ')
    expect(form.actions.submit('Ricambi Rossi S.r.l.')).toBeNull()
    expect(form.state.error).toBeNull()

    form.actions.change(' Rossi Ricambi ')
    expect(form.actions.submit('Ricambi Rossi S.r.l.')).toBe('Rossi Ricambi')
    form.actions.reset('Rossi Ricambi')
    expect(form.state).toEqual({ draft: 'Rossi Ricambi', error: null })
  })

  it('renames through Better Auth without touching the setup', async () => {
    const { client, workspace } = cached()
    update.mockReturnValue(new Promise(() => {}) as never)

    void new MutationObserver(client, renameCompanyMutation).mutate('Rossi Ricambi')

    await vi.waitFor(() => expect(workspace()).toMatchObject({ name: 'Rossi Ricambi' }))
    expect(update).toHaveBeenCalledWith({ data: { name: 'Rossi Ricambi' } })
  })
})

describe('company language', () => {
  it('switches right away and announces the new language', async () => {
    const { client, workspace } = cached()
    update.mockReturnValue(new Promise(() => {}) as never)

    void new MutationObserver(client, changeLanguageMutation).mutate('en')

    await vi.waitFor(() => expect(workspace()?.locale).toBe('en'))
    expect(update).toHaveBeenCalledWith({ data: { locale: 'en' } })
    expect(resolveNotice(changeLanguageMutation.meta, 'it', undefined)).toEqual(
      message('company.notices.language', { language: 'Italiano' })
    )
  })

  it('goes back when the core refuses the language', async () => {
    const { client, workspace } = cached()
    const refused = authError(400, 'LOCALE_NOT_SUPPORTED')
    update.mockRejectedValue(refused)

    await expect(new MutationObserver(client, changeLanguageMutation).mutate('en')).rejects.toBe(
      refused
    )

    expect(workspace()?.locale).toBe('it')
    expect(errorMessage(refused)).toEqual(message('errors.LOCALE_NOT_SUPPORTED'))
  })
})

describe('delete company', () => {
  it('says every account goes and asks for the name and an acknowledgement', () => {
    const spec = deleteCompanyConfirm(companyFixture())

    expect(spec).toMatchObject({
      body: message('company.confirm.delete.body', { company: 'Ricambi Rossi S.r.l.' }),
      facts: [{ label: message('company.confirm.delete.accounts'), value: '3' }],
      tone: 'danger',
      acknowledge: message('company.confirm.delete.acknowledge'),
    })
    expect(canConfirm(spec, 'ricambi rossi s.r.l.', true)).toBe(false)
    expect(canConfirm(spec, 'Ricambi Rossi S.r.l.')).toBe(false)
    expect(canConfirm(spec, 'Ricambi Rossi S.r.l.', true)).toBe(true)
  })

  it('signs everyone out of the cache once deleted', async () => {
    const { client, workspace } = cached()
    vi.mocked(authClient.organization.delete).mockResolvedValue({} as never)

    await new MutationObserver(client, deleteCompanyMutation(companyFixture())).mutate()

    expect(authClient.organization.delete).toHaveBeenCalledWith({ organizationId: '1' })
    expect(workspace()).toBeUndefined()
    expect(client.getQueryData(sessionQuery.queryKey)).toBeNull()
  })
})
