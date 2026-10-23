import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { ProfilePage } from '@/modules/auth/ui/profile-page'

export const Route = createFileRoute('/_app/(auth)/profile')({
  staticData: { crumb: 'profile' },
  head: pageHead('profile.title'),
  component: ProfilePage,
})
