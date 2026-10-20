import type { RefObject } from 'react'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { removeMemberConfirm, withoutMember } from '@/modules/workspaces/core/team'
import type { FullOrganization, Member } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useAction } from '@/ui/hooks/use-action'

type RemoveMemberDialogProps = {
  member: Member
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RemoveMemberDialog({ member, open, onClose, returnTo }: RemoveMemberDialogProps) {
  const { workspace } = useMe()
  const { client, pending, run } = useAction()

  return (
    <ConfirmDialog
      spec={open ? removeMemberConfirm(member, workspace) : null}
      pending={pending}
      onConfirm={async () => {
        const result = await run(
          () =>
            optimistic<FullOrganization>(
              client,
              workspaceKey,
              (organization) => withoutMember(organization, member.id),
              () => authClient.organization.removeMember({ memberIdOrEmail: member.id })
            ),
          { notice: 'team.notices.memberRemoved', values: { name: member.name } }
        )
        if (result.ok) onClose()
      }}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
