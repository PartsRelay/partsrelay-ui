import type { ConfirmSpec } from '@/modules/core/shared/confirm'
import { message } from '@/modules/core/shared/message'
import { createNameForm } from '@/modules/core/shared/name'
import { roleLabel } from '@/modules/core/workspace/role'
import type { Me, Workspace } from '@/modules/core/workspace/workspace'

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
  return createNameForm(current, message('profile.errors.nameRequired'))
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
