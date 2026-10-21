import { createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '@/modules/auth/ui/auth-layout'

export const Route = createFileRoute('/(auth)')({ component: AuthLayout })
