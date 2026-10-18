import { useMutation, useQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { signOutMutation } from '@/modules/auth/core/sign-out.mutation'

export function useSession() {
  const { data, isPending } = useQuery(sessionQuery)
  const signOut = useMutation(signOutMutation)

  return { email: data?.user.email ?? null, isPending, signOut }
}

export type SessionState = ReturnType<typeof useSession>
