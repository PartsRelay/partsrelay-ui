import type { ConfirmSpec } from '@/core/confirm'
import { message } from '@/core/message'
import { createNameForm } from '@/core/name'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export function createCompanyNameForm(current: string) {
  return createNameForm(current, message('company.errors.name-required'))
}

export function deleteCompanyConfirm(workspace: Workspace): ConfirmSpec {
  return {
    title: message('company.confirm.delete.title', { company: workspace.name }),
    body: message('company.confirm.delete.body', { company: workspace.name }),
    action: message('company.confirm.delete.action'),
    tone: 'danger',
    facts: [
      {
        label: message('company.confirm.delete.accounts'),
        value: String(workspace.members.length),
      },
    ],
    typeToConfirm: workspace.name,
    acknowledge: message('company.confirm.delete.acknowledge'),
  }
}
