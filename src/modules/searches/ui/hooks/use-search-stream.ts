import { Transmit } from '@adonisjs/transmit-client'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { env } from '@/env'
import { searchKeys } from '@/modules/searches/core/searches.query'

export function useSearchStream(workspaceId: string) {
  const client = useQueryClient()
  useEffect(() => {
    if (env.API_MOCKS) return
    let closed = false
    const invalidate = () => {
      if (!closed) void client.invalidateQueries({ queryKey: searchKeys.all(workspaceId) })
    }
    const transmit = new Transmit({
      baseUrl: (env.API_URL || window.location.origin).replace(/\/$/, '') + '/api/v1',
      maxReconnectAttempts: 5,
      onReconnectFailed: invalidate,
      onSubscribeFailed: invalidate,
    })
    const subscription = transmit.subscription(`workspaces/${workspaceId}/lookups`)
    const remove = subscription.onMessage<{ changed: boolean }>((data) => {
      if (data.changed) invalidate()
    })
    const connected = () => {
      if (closed) return
      invalidate()
      // create() retries while disconnected. Start only once the stream is ready.
      void subscription
        .create()
        .then(() => {
          if (closed) void subscription.delete().catch(() => undefined)
        })
        .catch(invalidate)
    }
    transmit.on('connected', connected)
    return () => {
      closed = true
      remove()
      transmit.off('connected', connected)
      void subscription.delete().catch(() => undefined)
      transmit.close()
    }
  }, [client, workspaceId])
}
