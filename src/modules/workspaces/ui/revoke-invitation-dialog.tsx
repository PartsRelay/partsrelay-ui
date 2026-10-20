import type { RefObject } from 'react'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import {
  type InvitationRow,
  revokeConfirm,
  withoutInvitation,
} from '@/modules/workspaces/core/team'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useAction } from '@/ui/hooks/use-action'

type RevokeInvitationDialogProps = {
  row: InvitationRow
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RevokeInvitationDialog({
  row,
  open,
  onClose,
  returnTo,
}: RevokeInvitationDialogProps) {
  const { client, pending, run } = useAction()
  const { id } = row.invitation

  return (
    <ConfirmDialog
      spec={open ? revokeConfirm(row) : null}
      pending={pending}
      onConfirm={async () => {
        const result = await run(
          () =>
            optimistic<FullOrganization>(
              client,
              workspaceKey,
              (organization) => withoutInvitation(organization, id),
              () => authClient.organization.cancelInvitation({ invitationId: id })
            ),
          { notice: 'team.notices.invitation-revoked' }
        )
        if (result.ok) onClose()
      }}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
