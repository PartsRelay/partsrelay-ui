import { createStore } from '@tanstack/store'
import { toDate } from '@/core/format'
import { type Message, message } from '@/core/message'
import { checkName } from '@/core/name'
import type { Locale } from '@/modules/workspaces/core/locale'
import type { Workspace } from '@/modules/workspaces/core/workspace'

type UserInvitation = {
  id: string
  organizationName: string
  status: string
  expiresAt: Date | string
}

export type SetupDraft = {
  name: string
  locale: Locale
  userName: string
  errors: { name: Message | null; userName: Message | null }
}

export type SetupValues = { name: string; locale: Locale; userName?: string }

type SetupOptions = { askName: boolean; browserLocale: Locale }

export function pendingInvitation(invitations: UserInvitation[] | undefined, now: Date) {
  return (
    invitations?.find(
      (invitation) => invitation.status === 'pending' && toDate(invitation.expiresAt) > now
    ) ?? null
  )
}

export function createSetupForm(
  workspace: Pick<Workspace, 'name' | 'locale' | 'setup'>,
  { askName, browserLocale }: SetupOptions
) {
  const pending = workspace.setup === 'pending'

  return createStore<SetupDraft, SetupFormActions>(
    {
      name: pending ? '' : workspace.name,
      locale: pending ? browserLocale : workspace.locale,
      userName: '',
      errors: { name: null, userName: null },
    },
    ({ setState, get }) => ({
      setName: (name) =>
        setState((draft) => ({ ...draft, name, errors: { ...draft.errors, name: null } })),
      setLocale: (locale) => setState((draft) => ({ ...draft, locale })),
      setUserName: (userName) =>
        setState((draft) => ({ ...draft, userName, errors: { ...draft.errors, userName: null } })),
      submit: () => {
        const { name, locale, userName } = get()
        const company = checkName(name, message('setup.errors.nameRequired'))
        const person = askName
          ? checkName(userName, message('setup.errors.userNameRequired'))
          : null
        setState((draft) => ({
          ...draft,
          errors: { name: company.error, userName: person?.error ?? null },
        }))
        if (company.error || person?.error) return null

        return person
          ? { name: company.value, locale, userName: person.value }
          : { name: company.value, locale }
      },
    })
  )
}

type SetupFormActions = {
  setName: (value: string) => void
  setLocale: (locale: Locale) => void
  setUserName: (value: string) => void
  submit: () => SetupValues | null
}
