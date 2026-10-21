import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/modules/auth/core/session.query'

export function useSession() {
  const { data, isPending } = useQuery(sessionQuery)

  return { email: data?.user.email ?? null, isPending }
}

export type SessionState = ReturnType<typeof useSession>
