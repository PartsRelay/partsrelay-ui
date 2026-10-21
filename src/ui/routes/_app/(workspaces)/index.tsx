import { createFileRoute } from '@tanstack/react-router'
import { redirectHome } from '@/modules/workspaces/ui/app-layout'

export const Route = createFileRoute('/_app/(workspaces)/')({ beforeLoad: redirectHome })
