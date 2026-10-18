import { createStore } from '@tanstack/store'
import { z } from 'zod'
import { type Message, message } from '@/core/message'
import type { Role } from '@/modules/workspaces/core/role'
import type { Me, Workspace } from '@/modules/workspaces/core/workspace'

export type InviteDraft = { email: string; role: Role; error: Message | null }

export type Invitee = { email: string; role: Role }

const email = z.email()

export function roleHint(role: Role, me: Me) {
  if (me.role !== 'owner') return message('team.invite.hints.adminInvitesViewers')

  return message(`team.invite.hints.${role}`)
}

export function checkInvitee(draft: InviteDraft, workspace: Workspace, now: Date) {
  const address = draft.email.trim().toLowerCase()

  if (!email.safeParse(address).success) return message('team.invite.errors.email')
  if (workspace.members.some((member) => member.email.toLowerCase() === address)) {
    return message('team.invite.errors.member')
  }

  const invited = workspace.invitations.some(
    (invitation) =>
      invitation.status === 'pending' &&
      invitation.expiresAt > now &&
      invitation.email.toLowerCase() === address
  )

  return invited ? message('team.invite.errors.invited') : null
}

export function createInviteForm(me: Me) {
  const allowed = me.permissions.inviteRoles

  return createStore<InviteDraft, InviteFormActions>(
    { email: '', role: allowed[0] ?? 'viewer', error: null },
    ({ setState, get }) => ({
      setEmail: (value) => setState((draft) => ({ ...draft, email: value, error: null })),
      setRole: (role) => {
        if (allowed.includes(role)) setState((draft) => ({ ...draft, role, error: null }))
      },
      submit: (workspace, now = new Date()) => {
        const error = checkInvitee(get(), workspace, now)
        setState((draft) => ({ ...draft, error }))

        return error ? null : { email: get().email.trim().toLowerCase(), role: get().role }
      },
      reset: () => setState((draft) => ({ ...draft, email: '', error: null })),
    })
  )
}

type InviteFormActions = {
  setEmail: (value: string) => void
  setRole: (role: Role) => void
  submit: (workspace: Workspace, now?: Date) => Invitee | null
  reset: () => void
}
