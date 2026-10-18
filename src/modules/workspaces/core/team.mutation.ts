import type { MutationFunctionContext, MutationOptions } from '@tanstack/query-core'
import {
  createOrganizationInvitation,
  postOrganizationCancelInvitation,
  postOrganizationRemoveMember,
  updateOrganizationMemberRole,
} from '@/core/api/auth/endpoints/organization/organization'
import { message } from '@/core/message'
import { optimistic, type Snapshot } from '@/core/optimistic'
import { sessionQuery } from '@/modules/auth/core/session.query'
import type { Invitee } from '@/modules/workspaces/core/invite-form'
import type { Role } from '@/modules/workspaces/core/role'
import type { FullOrganization, Invitation, Member } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'

type WorkspaceMutation<TVariables> = MutationOptions<
  unknown,
  Error,
  TVariables,
  Snapshot<FullOrganization>
>

type Members = FullOrganization['members']

function withMembers(organization: FullOrganization, update: (members: Members) => Members) {
  return { ...organization, members: update(organization.members) }
}

function withoutInvitation(organization: FullOrganization, id: string) {
  return {
    ...organization,
    invitations: organization.invitations.filter((invitation) => invitation.id !== id),
  }
}

function refreshTeam({ client }: MutationFunctionContext) {
  return client.invalidateQueries({ queryKey: workspaceKey })
}

export function changeRoleMutation(member: Member) {
  return {
    mutationKey: ['team', 'role', member.id],
    mutationFn: (role: Role) => updateOrganizationMemberRole({ memberId: member.id, role }),
    ...optimistic<FullOrganization, Role>(workspaceKey, (organization, role) =>
      withMembers(organization, (members) =>
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
    updateOrganizationMemberRole({ memberId: member.id, role: 'owner' }),
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
    mutationFn: () => postOrganizationRemoveMember({ memberIdOrEmail: member.id }),
    ...optimistic<FullOrganization, void>(workspaceKey, (organization) =>
      withMembers(organization, (members) => members.filter((item) => item.id !== member.id))
    ),
    onSettled: (_data, _error, _variables, _snapshot, context) => refreshTeam(context),
    meta: { notice: message('team.notices.memberRemoved', { name: member.name }) },
  } satisfies WorkspaceMutation<void>
}

export const inviteMutation = {
  mutationKey: ['team', 'invite'],
  mutationFn: ({ email, role }: Invitee) => createOrganizationInvitation({ email, role }),
  onSettled: (_data, _error, _variables, _result, { client }) =>
    client.invalidateQueries({ queryKey: workspaceKey }),
  meta: {
    notice: ({ email }: Invitee) => message('team.notices.invitationSent', { email }),
  },
} satisfies MutationOptions<unknown, Error, Invitee>

export function resendInvitationMutation(invitation: Invitation) {
  return {
    mutationKey: ['team', 'resend', invitation.id],
    mutationFn: () =>
      createOrganizationInvitation({
        email: invitation.email,
        role: invitation.role,
        resend: true,
      }),
    onSettled: (_data, _error, _variables, _result, { client }) =>
      client.invalidateQueries({ queryKey: workspaceKey }),
    meta: { notice: message('team.notices.invitationResent', { email: invitation.email }) },
  } satisfies MutationOptions<unknown, Error, void>
}

export function cancelInvitationMutation(invitation: Invitation) {
  return {
    mutationKey: ['team', 'cancel', invitation.id],
    mutationFn: () => postOrganizationCancelInvitation({ invitationId: invitation.id }),
    ...optimistic<FullOrganization, void>(workspaceKey, (organization) =>
      withoutInvitation(organization, invitation.id)
    ),
    meta: { notice: message('team.notices.invitationRevoked') },
  } satisfies WorkspaceMutation<void>
}
