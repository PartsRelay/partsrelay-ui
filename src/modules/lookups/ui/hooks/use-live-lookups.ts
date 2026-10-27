import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { liveClient } from '@/core/transmit'
import { mocksEnabled } from '@/mocks/enabled'
import { watchLookups } from '@/modules/lookups/core/lookups.live'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function useLiveLookups() {
  const client = useQueryClient()
  const { workspace } = useMe()

  useEffect(
    () => (mocksEnabled ? undefined : watchLookups(client, liveClient(), workspace.id)),
    [client, workspace.id]
  )
}
