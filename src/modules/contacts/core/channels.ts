import { getGetApiV1ChannelsQueryOptions } from '@/core/api/endpoints/channels/channels'
import type { ChannelLinkObject } from '@/core/api/models'
import { message } from '@/core/message'
import { formatPhone } from '@/modules/contacts/core/contact-row'

export function channelView({ source, address, url }: ChannelLinkObject) {
  return { source, label: message(`lookups.source.${source}`), address: formatPhone(address), url }
}

export const channelsQuery = getGetApiV1ChannelsQueryOptions({
  query: {
    select: ({ data }) => data.map(channelView),
    staleTime: Infinity,
    meta: { silent: true },
  },
})
