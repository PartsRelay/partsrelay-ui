import { createStore } from '@tanstack/store'
import type { ContactObject } from '@/core/api/models'
import { type Message, message } from '@/modules/core/shared/message'

export const CONTACT_NAME_MAX = 255

type RenameState = { id: number | null; draft: string; error: Message | null }

export type RenameKeyAction = 'save' | 'cancel' | null

export function renameKeyAction(key: string): RenameKeyAction {
  if (key === 'Enter') return 'save'
  if (key === 'Escape') return 'cancel'

  return null
}

export function createContactRename() {
  return createStore<RenameState, RenameActions>(
    { id: null, draft: '', error: null },
    ({ setState, get }) => ({
      start: (contact) =>
        setState(() => ({ id: contact.id, draft: contact.name ?? '', error: null })),
      change: (draft) => setState((state) => ({ ...state, draft, error: null })),
      cancel: () => setState(() => ({ id: null, draft: '', error: null })),
      commit: (contact) => {
        const name = get().draft.trim() || null

        if (name && name.length > CONTACT_NAME_MAX) {
          setState((state) => ({
            ...state,
            error: message('contacts.errors.nameTooLong', { max: CONTACT_NAME_MAX }),
          }))

          return null
        }

        setState(() => ({ id: null, draft: '', error: null }))

        return name === contact.name ? null : { id: contact.id, name }
      },
    })
  )
}

export type ContactRename = ReturnType<typeof createContactRename>

type RenameActions = {
  start: (contact: ContactObject) => void
  change: (draft: string) => void
  cancel: () => void
  commit: (contact: ContactObject) => { id: number; name: string | null } | null
}
