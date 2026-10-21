import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { cancelOneTap, oneTapError, startOneTap } from '@/modules/auth/core/one-tap'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { notify } from '@/core/notify'

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
        if (problem) notify('danger', ...problem)
      },
    })

    return cancelOneTap
  }, [client, navigate, afterSignIn])
}
