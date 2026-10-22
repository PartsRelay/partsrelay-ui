import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { message } from '@/core/message'
import {
  addContact,
  changeNotice,
  removeContact,
  updateContact,
} from '@/modules/contacts/core/contacts.mutation'
import { type ContactsPage, contactsListKey } from '@/modules/contacts/core/contacts.query'
import { contactFixture, coreError, pageFixture } from '@/modules/contacts/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

const all = { page: 1 }
const active = { status: ['active' as const], page: 1 }
const blocked = { status: ['blocked' as const], page: 1 }
const never = () => new Promise<never>(() => {})

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const oakfield = contactFixture(1, { name: 'Oakfield Garage', profileName: 'Tom Walker' })
  const quickFit = contactFixture(2, { status: 'blocked', profileName: 'Sam Lee' })
  client.setQueryData(contactsListKey(all), pageFixture([quickFit, oakfield]))
  client.setQueryData(contactsListKey(active), pageFixture([oakfield]))
  client.setQueryData(contactsListKey(blocked), pageFixture([quickFit]))
  const list = (params: typeof all) => client.getQueryData<ContactsPage>(contactsListKey(params))!

  return { client, oakfield, quickFit, list }
}

const sent = (method: string, url: string, data?: unknown) =>
  expect(http).toHaveBeenCalledWith(
    expect.objectContaining({ method, url, ...(data !== undefined && { data }) }),
    undefined
  )

beforeEach(() => vi.resetAllMocks())

describe('contact changes', () => {
  it('moves a blocked contact out of the active list right away', async () => {
    const { client, oakfield, list } = setup()
    vi.mocked(http).mockReturnValue(never())

    void updateContact(client, oakfield, { status: 'blocked' })

    await vi.waitFor(() => expect(list(active).data).toHaveLength(0))
    expect(list(active).metadata.total).toBe(0)
    expect(list(all).data.map((item) => item.status)).toEqual(['blocked', 'blocked'])
    sent('PATCH', '/api/v1/workspace/contacts/1', { status: 'blocked' })
  })

  it('unblocks and refreshes every list once the core answers', async () => {
    const { client, quickFit, list } = setup()
    vi.mocked(http).mockResolvedValue({ data: { ...quickFit, status: 'active' } })

    await updateContact(client, quickFit, { status: 'active' })

    expect(list(blocked).data).toHaveLength(0)
    expect(client.getQueryState(contactsListKey(active))?.isInvalidated).toBe(true)
  })

  it('renames in place, null clears the given name', async () => {
    const { client, oakfield, list } = setup()
    vi.mocked(http).mockReturnValue(never())

    void updateContact(client, oakfield, { name: null })

    await vi.waitFor(() => expect(list(all).data[1]!.name).toBeNull())
    expect(list(active).data[0]!.name).toBeNull()
    sent('PATCH', '/api/v1/workspace/contacts/1', { name: null })
  })

  it('restores a deleted contact when the core refuses', async () => {
    const { client, oakfield, list } = setup()
    vi.mocked(http).mockRejectedValue(coreError(403, 'AUTHORIZATION_FAILURE'))

    await expect(removeContact(client, oakfield)).rejects.toBeTruthy()
    expect(list(all).data.map((item) => item.id)).toEqual([2, 1])
    expect(list(active).metadata.total).toBe(1)
    sent('DELETE', '/api/v1/workspace/contacts/1')
  })

  it('adds a contact and refreshes the lists', async () => {
    const { client } = setup()
    const created = contactFixture(3, { profileName: null, waId: '447700900103' })
    vi.mocked(http).mockResolvedValue({ data: created })
    const contact = { phone: '+44 7700 900103' }

    await expect(addContact(client, contact)).resolves.toEqual(created)
    sent('POST', '/api/v1/workspace/contacts', contact)
    expect(client.getQueryState(contactsListKey(all))?.isInvalidated).toBe(true)
  })

  it('tells what changed', () => {
    const oakfield = contactFixture(1, { name: 'Oakfield Garage' })

    expect(changeNotice(oakfield, { status: 'blocked' })).toEqual(
      message('contacts.notices.blocked', { name: 'Oakfield Garage' })
    )
    expect(changeNotice(oakfield, { status: 'active' })).toEqual(
      message('contacts.notices.unblocked', { name: 'Oakfield Garage' })
    )
    expect(changeNotice(oakfield, { name: 'Oakfield Motors' })).toEqual(
      message('contacts.notices.renamed', { name: 'Oakfield Motors' })
    )
    expect(changeNotice(oakfield, { name: null })).toEqual(message('contacts.notices.name-cleared'))
  })
})
