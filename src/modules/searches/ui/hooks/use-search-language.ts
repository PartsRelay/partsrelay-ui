import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { i18n } from '@/i18n'
import { searchKeys } from '@/modules/searches/core/searches.query'

export function useSearchLanguage(workspaceId: string) {
  const client = useQueryClient()
  useEffect(() => {
    let closed = false
    const changed = () => {
      const queryKey = searchKeys.all(workspaceId)
      // An older-language response must not repopulate the cache after the change.
      void client.cancelQueries({ queryKey }).then(() => {
        if (!closed) void client.invalidateQueries({ queryKey })
      })
    }
    i18n.on('languageChanged', changed)
    return () => {
      closed = true
      i18n.off('languageChanged', changed)
    }
  }, [client, workspaceId])
}
