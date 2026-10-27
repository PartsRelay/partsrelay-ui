import { describe, expect, it, vi } from 'vite-plus/test'
import { message } from '@/core/message'
import { channelsQuery, channelView } from '@/modules/contacts/core/channels'

vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

describe('channels', () => {
  it('shows where workshops write, with the number grouped by country', () => {
    const whatsapp = {
      source: 'whatsapp' as const,
      address: '+390287341190',
      url: 'https://wa.me/390287341190',
    }

    expect(channelView(whatsapp)).toEqual({
      source: 'whatsapp',
      label: message('lookups.source.whatsapp'),
      address: '+39 02 8734 1190',
      url: 'https://wa.me/390287341190',
    })
    expect(channelsQuery.queryKey).toEqual(['/api/v1/channels'])
    expect(channelsQuery.select?.({ data: [whatsapp] })).toEqual([channelView(whatsapp)])
  })
})
