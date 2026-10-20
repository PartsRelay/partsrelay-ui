import { createStore } from '@tanstack/store'
import type { Message } from '@/core/message'

// The core checks the length
export function isClean(draft: string, required: Message) {
  const value = draft.trim()

  return { value, error: value === '' ? required : null }
}

export type CleanDraft = { draft: string; error: Message | null }

export function createCleanForm(current: string, required: Message) {
  return createStore<CleanDraft, CleanFormActions>(
    { draft: current, error: null },
    ({ setState, get }) => ({
      change: (draft) => setState(() => ({ draft, error: null })),
      reset: (name) => setState(() => ({ draft: name, error: null })),
      submit: (name) => {
        const { value, error } = isClean(get().draft, required)
        setState((state) => ({ ...state, error }))

        return error || value === name.trim() ? null : value
      },
    })
  )
}

type CleanFormActions = {
  change: (draft: string) => void
  reset: (name: string) => void
  submit: (current: string) => string | null
}
