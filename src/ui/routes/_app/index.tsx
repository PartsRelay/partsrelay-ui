import { createFileRoute, redirect } from '@tanstack/react-router'
import { homePath } from '@/modules/core/workspace/navigation'

export const Route = createFileRoute('/_app/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: homePath(context.me.permissions) })
  },
})
