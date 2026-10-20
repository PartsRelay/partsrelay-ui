import { createStore } from '@tanstack/store'
import type { Message } from '@/core/message'

// The core checks the length
export function checkName(draft: string, required: Message) {
  const value = draft.trim()

  return { value, error: value === '' ? required : null }
}

export type NameDraft = { draft: string; error: Message | null }

export function createNameForm(current: string, required: Message) {
  return createStore<NameDraft, NameFormActions>(
    { draft: current, error: null },
    ({ setState, get }) => ({
      change: (draft) => setState(() => ({ draft, error: null })),
      reset: (name) => setState(() => ({ draft: name, error: null })),
      submit: (name) => {
        const { value, error } = checkName(get().draft, required)
        setState((state) => ({ ...state, error }))

        return error || value === name.trim() ? null : value
      },
    })
  )
}

type NameFormActions = {
  change: (draft: string) => void
  reset: (name: string) => void
  submit: (current: string) => string | null
}
