import { roleLabel } from '@/modules/workspaces/core/role'
import type { Me, Workspace } from '@/modules/workspaces/core/workspace'

export type ProfileView = ReturnType<typeof profileView>

export function profileView(me: Me, workspace: Workspace) {
  return {
    name: me.member.name,
    email: me.member.email,
    image: me.member.image,
    company: workspace.name,
    roleLabel: roleLabel(me.role),
    canLeave: me.permissions.leaveCompany,
  }
}
