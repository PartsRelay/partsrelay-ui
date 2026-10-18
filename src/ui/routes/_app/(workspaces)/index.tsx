import { createFileRoute, redirect } from '@tanstack/react-router'
import { homePath } from '@/modules/workspaces/core/navigation'

export const Route = createFileRoute('/_app/(workspaces)/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: homePath(context.me.permissions) })
  },
})
