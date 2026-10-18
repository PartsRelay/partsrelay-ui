import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/modules/auth/ui/profile-page'

export const Route = createFileRoute('/_app/(auth)/profile')({
  staticData: { crumb: 'profile' },
  component: ProfilePage,
})
