import { createFileRoute, redirect } from '@tanstack/react-router'
import { readCallbackToken } from '@/modules/core/auth/callback-token'
import { session } from '@/modules/core/auth/session.store'

export const Route = createFileRoute('/(auth)/callback')({
  beforeLoad: () => {
    const token = readCallbackToken(window.location.hash)

    if (!token) throw redirect({ to: '/login' })

    session.signIn(token)
    throw redirect({ to: '/' })
  },
})
