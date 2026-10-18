import type { MutationFunctionContext, MutationOptions } from '@tanstack/query-core'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { optimistic, type Snapshot } from '@/core/optimistic'
import type { Invitee } from '@/modules/workspaces/core/invite-form'
import type { Role } from '@/modules/workspaces/core/role'
import type { Invitation, Member, Workspace } from '@/modules/workspaces/core/workspace'
import { workspaceKeys } from '@/modules/workspaces/core/workspace.query'

type WorkspaceMutation<TVariables> = MutationOptions<
  unknown,
  Error,
  TVariables,
  Snapshot<Workspace>
>

function withMembers(workspace: Workspace, update: (members: Member[]) => Member[]) {
  return { ...workspace, members: update(workspace.members) }
}

function withoutInvitation(workspace: Workspace, id: string) {
  return {
    ...workspace,
    invitations: workspace.invitations.filter((invitation) => invitation.id !== id),
  }
}

function refreshTeam({ client }: MutationFunctionContext) {
  return client.invalidateQueries({ queryKey: workspaceKeys.all })
}

export function changeRoleMutation(member: Member) {
  return {
    mutationKey: ['team', 'role', member.id],
    mutationFn: (role: Role) =>
      authClient.organization.updateMemberRole({ memberId: member.id, role }),
    ...optimistic<Workspace, Role>(workspaceKeys.all, (workspace, role) =>
      withMembers(workspace, (members) =>
        members.map((item) => (item.id === member.id ? { ...item, role } : item))
      )
    ),
    onSettled: (_data, _error, _role, _snapshot, context) => refreshTeam(context),
    meta: {
      notice: (role: Role) => message(`team.notices.roleChanged.${role}`, { name: member.name }),
    },
  } satisfies WorkspaceMutation<Role>
}

export const transferOwnershipMutation = {
  mutationKey: ['team', 'transfer'],
  mutationFn: (member: Member) =>
    authClient.organization.updateMemberRole({ memberId: member.id, role: 'owner' }),
  onSettled: (_data, _error, _member, _result, context) =>
    Promise.all([
      refreshTeam(context),
      context.client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
    ]),
  meta: {
    notice: (member: Member) => message('team.notices.ownershipTransferred', { name: member.name }),
  },
} satisfies MutationOptions<unknown, Error, Member>

export function removeMemberMutation(member: Member) {
  return {
    mutationKey: ['team', 'remove', member.id],
    mutationFn: () => authClient.organization.removeMember({ memberIdOrEmail: member.id }),
    ...optimistic<Workspace, void>(workspaceKeys.all, (workspace) =>
      withMembers(workspace, (members) => members.filter((item) => item.id !== member.id))
    ),
    onSettled: (_data, _error, _variables, _snapshot, context) => refreshTeam(context),
    meta: { notice: message('team.notices.memberRemoved', { name: member.name }) },
  } satisfies WorkspaceMutation<void>
}

export const inviteMutation = {
  mutationKey: ['team', 'invite'],
  mutationFn: ({ email, role }: Invitee) => authClient.organization.inviteMember({ email, role }),
  onSettled: (_data, _error, _variables, _result, { client }) =>
    client.invalidateQueries({ queryKey: workspaceKeys.all }),
  meta: {
    notice: ({ email }: Invitee) => message('team.notices.invitationSent', { email }),
  },
} satisfies MutationOptions<unknown, Error, Invitee>

export function resendInvitationMutation(invitation: Invitation) {
  return {
    mutationKey: ['team', 'resend', invitation.id],
    mutationFn: () =>
      authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role,
        resend: true,
      }),
    onSettled: (_data, _error, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: workspaceKeys.all }),
    meta: { notice: message('team.notices.invitationResent', { email: invitation.email }) },
  } satisfies MutationOptions<unknown, Error, void>
}

export function cancelInvitationMutation(invitation: Invitation) {
  return {
    mutationKey: ['team', 'cancel', invitation.id],
    mutationFn: () => authClient.organization.cancelInvitation({ invitationId: invitation.id }),
    ...optimistic<Workspace, void>(workspaceKeys.all, (workspace) =>
      withoutInvitation(workspace, invitation.id)
    ),
    meta: { notice: message('team.notices.invitationRevoked') },
  } satisfies WorkspaceMutation<void>
}
