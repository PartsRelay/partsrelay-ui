import { useStore } from '@tanstack/react-store'
import { session } from '@/modules/core/auth/session.store'

export function useSession() {
  const token = useStore(session.store, (state) => state.token)

  return { token, isSignedIn: token !== null, signIn: session.signIn, signOut: session.signOut }
}
