import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { contactsSearchSchema, tabStatus } from '@/modules/contacts/core/contacts'
import { contactListParams, contactsQuery } from '@/modules/contacts/core/contacts.query'
import { contactFixture, pageFixture } from '@/modules/contacts/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

const oakfield = contactFixture(1, { name: 'Oakfield Garage' })

beforeEach(() => vi.resetAllMocks())

describe('contact list', () => {
  it('reads the tab, the search and the page from the address', () => {
    expect(contactsSearchSchema.parse({})).toEqual({ page: 1 })
    expect(contactsSearchSchema.parse({ status: 'blocked', search: 'oak', page: 3 })).toEqual({
      status: 'blocked',
      search: 'oak',
      page: 3,
    })
    expect(contactsSearchSchema.parse({ status: 'pending', page: 0 })).toEqual({
      status: undefined,
      page: 1,
    })
    expect(tabStatus('active')).toBe('active')
    expect(tabStatus('all')).toBeUndefined()
  })

  it('asks the core for one status and the search, through the generated client', async () => {
    vi.mocked(http).mockResolvedValue(pageFixture([oakfield]))
    const params = contactListParams({ status: 'blocked', page: 2, search: 'oak' })

    expect(contactListParams({ page: 1 })).toEqual({ page: 1 })
    expect(params).toEqual({ status: 'blocked', page: 2, search: 'oak' })
    expect(contactsQuery(params).queryKey).toEqual(['/api/v1/workspace/contacts', params])
    expect(contactsQuery(params).meta).toEqual({ silent: true })

    await new QueryClient().fetchQuery(contactsQuery(params))
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/v1/workspace/contacts', method: 'GET', params }),
      undefined
    )
    expect(axios.getUri({ url: '/contacts', params })).toBe(
      '/contacts?page=2&status=blocked&search=oak'
    )
  })

  it('keeps the previous list while the next loads', () => {
    const previous = pageFixture([oakfield])
    const placeholder = contactsQuery({ page: 2 }).placeholderData

    expect(typeof placeholder === 'function' && placeholder(previous, undefined)).toBe(previous)
  })
})
