import { createFileRoute, redirect } from '@tanstack/react-router'
import { callbackSearchSchema, completeSignIn } from '@/modules/auth/core/sign-in'

export const Route = createFileRoute('/(auth)/auth/callback')({
  validateSearch: callbackSearchSchema,
  beforeLoad: async ({ context, search }) => {
    throw redirect({ href: await completeSignIn(context.queryClient, search) })
  },
})
