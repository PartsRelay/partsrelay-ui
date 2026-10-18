import { createStore } from '@tanstack/store'
import type { ConfirmSpec } from '@/modules/core/shared/confirm'
import { type Message, message } from '@/modules/core/shared/message'
import { checkName } from '@/modules/core/shared/name'
import type { Workspace } from '@/modules/core/workspace/workspace'

export type CompanyNameDraft = { draft: string; error: Message | null }

export function createCompanyNameForm(current: string) {
  return createStore<CompanyNameDraft, CompanyNameActions>(
    { draft: current, error: null },
    ({ setState, get }) => ({
      change: (draft) => setState(() => ({ draft, error: null })),
      reset: (name) => setState(() => ({ draft: name, error: null })),
      submit: (name) => {
        const { value, error } = checkName(get().draft, message('company.errors.nameRequired'))
        setState((state) => ({ ...state, error }))

        return error || value === name.trim() ? null : value
      },
    })
  )
}

type CompanyNameActions = {
  change: (draft: string) => void
  reset: (name: string) => void
  submit: (current: string) => string | null
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
