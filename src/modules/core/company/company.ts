import type { ConfirmSpec } from '@/modules/core/shared/confirm'
import { message } from '@/modules/core/shared/message'
import { createNameForm } from '@/modules/core/shared/name'
import type { Workspace } from '@/modules/core/workspace/workspace'

export function createCompanyNameForm(current: string) {
  return createNameForm(current, message('company.errors.nameRequired'))
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
