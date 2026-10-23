import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { loginSearchSchema } from '@/modules/auth/core/sign-in'
import { LoginPage, redirectIfSignedIn } from '@/modules/auth/ui/login-page'

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: loginSearchSchema,
  head: pageHead('login.sign-in'),
  beforeLoad: redirectIfSignedIn,
  component: LoginPage,
})
