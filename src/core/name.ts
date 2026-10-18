import { createStore } from '@tanstack/store'
import { type Message, message } from '@/core/message'

export const NAME_MAX = 255

export function checkName(draft: string, required: Message) {
  const value = draft.trim()
  if (value === '') return { value, error: required }
  if (value.length > NAME_MAX) {
    return { value, error: message('validation.tooLong', { max: NAME_MAX }) }
  }

  return { value, error: null }
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
