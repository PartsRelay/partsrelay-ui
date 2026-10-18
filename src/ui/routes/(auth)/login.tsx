import { createFileRoute } from '@tanstack/react-router'
import { loginSearchSchema } from '@/modules/auth/core/sign-in'
import { LoginPage, redirectIfSignedIn } from '@/modules/auth/ui/login-page'

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: redirectIfSignedIn,
  component: LoginPage,
})
