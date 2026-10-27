import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { useSignOut } from '@/modules/auth/ui/hooks/use-sign-out'

export function useSession() {
  const { data, isPending } = useQuery(sessionQuery)
  const { pending: signingOut, signOut } = useSignOut()

  return {
    email: data?.user.email ?? null,
    name: data?.user.name ?? null,
    isPending,
    signingOut,
    signOut,
  }
}

export type SessionState = ReturnType<typeof useSession>
