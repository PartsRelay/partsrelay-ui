import { createFileRoute } from '@tanstack/react-router'
import { signInErrorSearchSchema } from '@/modules/auth/core/sign-in'
import { InvitationPage } from '@/modules/auth/ui/invitation-page'

export const Route = createFileRoute('/(auth)/invitations/$invitationId')({
  validateSearch: signInErrorSearchSchema,
  component: InvitationPage,
})
