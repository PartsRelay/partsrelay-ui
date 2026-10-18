import { useMutation, useQuery } from '@tanstack/react-query'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { signOutMutation } from '@/modules/core/auth/sign-out.mutation'

export function useSession() {
  const { data, isPending } = useQuery(sessionQuery)
  const signOut = useMutation(signOutMutation)

  return { email: data?.user.email ?? null, isPending, signOut }
}

export type SessionState = ReturnType<typeof useSession>
