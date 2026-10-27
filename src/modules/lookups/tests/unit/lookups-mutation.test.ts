import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { http } from '@/core/http/client'
import { coreError } from '@/modules/contacts/tests/unit/fixtures'
import { startLookup } from '@/modules/lookups/core/lookups.mutation'
import { lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { lookupFixture, pageFixture } from '@/modules/lookups/tests/unit/fixtures'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('starting a search', () => {
  it('sends the plate and the part, then reloads every list', async () => {
    const running = lookupFixture(12, { status: 'running', vin: null, categories: undefined })
    vi.mocked(http).mockResolvedValue({ data: running })
    const client = new QueryClient()
    const list = lookupsQuery({ page: 1 }).queryKey
    client.setQueryData(list, pageFixture([]))

    expect(await startLookup(client, { plate: 'AB123CD', query: 'filtro olio' })).toBe(running)
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/lookups',
        method: 'POST',
        data: { plate: 'AB123CD', query: 'filtro olio' },
      }),
      undefined
    )
    expect(client.getQueryState(list)?.isInvalidated).toBe(true)
  })

  it('leaves the lists alone when the core refuses the search', async () => {
    vi.mocked(http).mockRejectedValue(
      coreError(422, 'validation-error', [{ field: 'plate', rule: 'plate' }])
    )
    const client = new QueryClient()
    const list = lookupsQuery({ page: 1 }).queryKey
    client.setQueryData(list, pageFixture([]))

    await expect(startLookup(client, { plate: 'AB123CD', query: 'olio' })).rejects.toThrow()
    expect(client.getQueryState(list)?.isInvalidated).toBe(false)
  })
})
