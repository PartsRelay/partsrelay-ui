import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { cancelOneTap, oneTapError, startOneTap } from '@/modules/core/auth/one-tap'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { translate } from '@/ui/providers/i18n'

export function useOneTap(afterSignIn: string) {
  const client = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    startOneTap({
      onSuccess: async () => {
        await client.invalidateQueries({ queryKey: sessionQuery.queryKey, refetchType: 'all' })
        await navigate({ href: afterSignIn })
      },
      onError: (error) => {
        const problem = oneTapError(error)
        if (problem) toast.error(translate(problem))
      },
    })

    return cancelOneTap
  }, [client, navigate, afterSignIn])
}
