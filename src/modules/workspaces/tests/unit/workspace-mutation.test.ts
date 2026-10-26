import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { updateCompany } from '@/modules/workspaces/core/workspace.mutation'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: { organization: { update } } }))

const redwoodParts = (): FullOrganization => ({
  id: '1',
  name: 'Redwood Parts Ltd',
  slug: 'redwood-parts',
  logo: null,
  metadata: '{"setup":"done"}',
  locale: 'en-US',
  createdAt: new Date('2025-09-16T10:00:00Z'),
  members: [],
  invitations: [],
})

let client: QueryClient

beforeEach(() => {
  client = new QueryClient()
  client.setQueryData(workspaceKey, redwoodParts())
  update.mockReset()
})

describe('updateCompany', () => {
  it('shows the new name at once and sends it to the core', async () => {
    update.mockReturnValue(new Promise(() => {}))

    void updateCompany(client, { name: 'Redwood Motors Ltd' })

    await vi.waitFor(() =>
      expect(client.getQueryData(workspaceKey)?.name).toBe('Redwood Motors Ltd')
    )
    expect(update).toHaveBeenCalledWith({ data: { name: 'Redwood Motors Ltd' } })
  })

  it('restores the language when the core refuses', async () => {
    update.mockRejectedValue(new Error('Refused'))

    await expect(updateCompany(client, { locale: 'it-IT' })).rejects.toThrow('Refused')
    expect(client.getQueryData(workspaceKey)?.locale).toBe('en-US')
  })
})
