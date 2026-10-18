import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  deleteApiV1WorkspaceContactsContactId,
  patchApiV1WorkspaceContactsContactId,
  postApiV1WorkspaceContacts,
} from '@/core/api/endpoints/contacts/contacts'
import {
  blockContactMutation,
  createContactMutation,
  removeContactMutation,
  renameContactMutation,
  unblockContactMutation,
} from '@/modules/core/contacts/contacts.mutation'
import { type ContactsPage, contactKeys } from '@/modules/core/contacts/contacts.query'
import { resolveNotice } from '@/modules/core/shared/notice'
import { axiosError, contactFixture, pageFixture } from '@/modules/core/testing/fixtures'

vi.mock('@/core/api/endpoints/contacts/contacts', () => ({
  postApiV1WorkspaceContacts: vi.fn(),
  patchApiV1WorkspaceContactsContactId: vi.fn(),
  deleteApiV1WorkspaceContactsContactId: vi.fn(),
}))

const all = { page: 1, perPage: 20 }
const active = { status: ['active' as const], page: 1, perPage: 20 }
const blocked = { status: ['blocked' as const], page: 1, perPage: 20 }
const never = () => new Promise<never>(() => {})

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const verdi = contactFixture(1, { name: 'Officina Verdi', profileName: 'Paolo Verdi' })
  const neri = contactFixture(2, { status: 'blocked', profileName: 'Giovanni Neri' })
  client.setQueryData(contactKeys.list(all), pageFixture([neri, verdi]))
  client.setQueryData(contactKeys.list(active), pageFixture([verdi]))
  client.setQueryData(contactKeys.list(blocked), pageFixture([neri]))
  const list = (params: object) =>
    client.getQueryData<ContactsPage>(contactKeys.list(params as typeof all))!

  return { client, verdi, neri, list }
}

beforeEach(() => vi.resetAllMocks())

describe('contact mutations', () => {
  it('moves a blocked contact out of the active list right away', async () => {
    const { client, verdi, list } = setup()
    vi.mocked(patchApiV1WorkspaceContactsContactId).mockReturnValue(never())
    const options = blockContactMutation(verdi)

    void new MutationObserver(client, options).mutate()

    await vi.waitFor(() => expect(list(active).data).toHaveLength(0))
    expect(list(active).metadata.total).toBe(0)
    expect(list(all).data.map((item) => item.status)).toEqual(['blocked', 'blocked'])
    expect(patchApiV1WorkspaceContactsContactId).toHaveBeenCalledWith('1', { status: 'blocked' })
    expect(resolveNotice(options.meta, undefined, undefined)).toEqual({
      key: 'contacts.notices.blocked',
      values: { name: 'Officina Verdi' },
    })
  })

  it('unblocks and refreshes every list once the core answers', async () => {
    const { client, neri, list } = setup()
    vi.mocked(patchApiV1WorkspaceContactsContactId).mockResolvedValue({ data: neri })

    await new MutationObserver(client, unblockContactMutation(neri)).mutate()

    expect(list(blocked).data).toHaveLength(0)
    expect(patchApiV1WorkspaceContactsContactId).toHaveBeenCalledWith('2', { status: 'active' })
    expect(client.getQueryState(contactKeys.list(active))?.isInvalidated).toBe(true)
  })

  it('renames in place, null clears the custom name', async () => {
    const { client, verdi, list } = setup()
    vi.mocked(patchApiV1WorkspaceContactsContactId).mockReturnValue(never())
    const options = renameContactMutation(verdi)

    void new MutationObserver(client, options).mutate(null)

    await vi.waitFor(() => expect(list(all).data[1]!.name).toBeNull())
    expect(list(active).data[0]!.name).toBeNull()
    expect(patchApiV1WorkspaceContactsContactId).toHaveBeenCalledWith('1', { name: null })
    expect(resolveNotice(options.meta, null, undefined)).toEqual({
      key: 'contacts.notices.nameCleared',
    })
    expect(resolveNotice(options.meta, 'Verdi Ricambi', undefined)).toEqual({
      key: 'contacts.notices.renamed',
      values: { name: 'Verdi Ricambi' },
    })
  })

  it('restores a deleted contact when the core refuses', async () => {
    const { client, verdi, list } = setup()
    vi.mocked(deleteApiV1WorkspaceContactsContactId).mockRejectedValue(
      axiosError(403, { error: { code: 'AUTHORIZATION_FAILURE' } })
    )
    const options = removeContactMutation(verdi)

    await expect(new MutationObserver(client, options).mutate()).rejects.toBeTruthy()
    expect(list(all).data.map((item) => item.id)).toEqual([2, 1])
    expect(list(active).metadata.total).toBe(1)
    expect(deleteApiV1WorkspaceContactsContactId).toHaveBeenCalledWith('1')
    expect(resolveNotice(options.meta, undefined, undefined)).toEqual({
      key: 'contacts.notices.removed',
      values: { name: 'Officina Verdi' },
    })
  })

  it('adds a contact, refreshes the lists and names it by its number', async () => {
    const { client } = setup()
    const created = contactFixture(3, { profileName: null, waId: '393471234567' })
    vi.mocked(postApiV1WorkspaceContacts).mockResolvedValue({ data: created })
    const contact = { phone: '+393471234567' }

    const result = await new MutationObserver(client, createContactMutation).mutate(contact)

    expect(postApiV1WorkspaceContacts).toHaveBeenCalledWith(contact)
    expect(client.getQueryState(contactKeys.list(all))?.isInvalidated).toBe(true)
    expect(createContactMutation.meta.silent).toBe(true)
    expect(resolveNotice(createContactMutation.meta, contact, result)).toEqual({
      key: 'contacts.notices.added',
      values: { name: '+39 347 123 4567' },
    })
  })
})
