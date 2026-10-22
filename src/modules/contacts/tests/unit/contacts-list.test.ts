import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { withPerPage } from '@/core/pagination'
import { contactsSearchSchema, tabStatus } from '@/modules/contacts/core/contacts'
import {
  contactListParams,
  contactsListKey,
  contactsQuery,
} from '@/modules/contacts/core/contacts.query'
import { contactFixture, pageFixture } from '@/modules/contacts/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

const oakfield = contactFixture(1, { name: 'Oakfield Garage' })

beforeEach(() => vi.resetAllMocks())

describe('contact list', () => {
  it('reads the tab and page from the address', () => {
    expect(contactsSearchSchema.parse({})).toEqual({ page: 1 })
    expect(contactsSearchSchema.parse({ status: 'blocked', page: 3 })).toEqual({
      status: 'blocked',
      page: 3,
    })
    expect(contactsSearchSchema.parse({ status: 'pending', page: 0 })).toEqual({
      status: undefined,
      page: 1,
    })
    expect(tabStatus('active')).toBe('active')
    expect(tabStatus('all')).toBeUndefined()
  })

  it('asks the core for one status as a list, through the generated client', async () => {
    vi.mocked(http).mockResolvedValue(pageFixture([oakfield]))
    const params = contactListParams({ status: 'blocked', page: 2 })

    expect(contactListParams({ page: 1 })).toEqual({ page: 1 })
    expect(params).toEqual({ status: ['blocked'], page: 2 })
    expect(contactsQuery(params).queryKey).toEqual(['/api/v1/workspace/contacts', params])
    expect(contactsQuery(params).meta).toEqual({ silent: true })

    await new QueryClient().fetchQuery(contactsQuery(params))
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/workspace/contacts', method: 'GET' }),
      { params: { ...params, perPage: 20 } }
    )
    expect(axios.getUri({ url: '/contacts', params: withPerPage(params) })).toBe(
      '/contacts?status%5B%5D=blocked&page=2&perPage=20'
    )
  })

  it('keeps the previous page while the next loads, not across tabs', () => {
    const client = new QueryClient()
    const previous = pageFixture([oakfield])
    const active = { status: ['active' as const], page: 1 }
    client.setQueryData(contactsListKey(active), previous)
    const query = client.getQueryCache().find({ queryKey: contactsListKey(active) })!
    const placeholder = (params: typeof active) =>
      contactsQuery(params).placeholderData(previous, query as never)

    expect(placeholder({ ...active, page: 2 })).toBe(previous)
    expect(placeholder({ ...active, status: ['blocked' as never] })).toBeUndefined()
    expect(contactsQuery(active).placeholderData()).toBeUndefined()
  })
})
