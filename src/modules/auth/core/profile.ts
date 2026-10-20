import type { ConfirmSpec } from '@/core/confirm'
import { message } from '@/core/message'
import { createNameForm } from '@/core/cleaner'
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

export function createUserNameForm(current: string) {
  return createNameForm(current, message('profile.errors.name-required'))
}

export function leaveCompanyConfirm(view: ProfileView): ConfirmSpec {
  return {
    title: message('profile.confirm.leave.title', { company: view.company }),
    body: message('profile.confirm.leave.body'),
    action: message('profile.confirm.leave.action'),
    tone: 'danger',
    facts: [
      { label: message('profile.identity.email'), value: view.email },
      { label: message('profile.identity.role'), value: view.roleLabel },
    ],
    acknowledge: message('profile.confirm.leave.acknowledge'),
  }
}
