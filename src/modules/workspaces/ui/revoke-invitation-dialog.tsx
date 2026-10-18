import { useMutation } from '@tanstack/react-query'
import type { RefObject } from 'react'
import { type InvitationRow, revokeConfirm } from '@/modules/workspaces/core/team'
import { cancelInvitationMutation } from '@/modules/workspaces/core/team.mutation'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'

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
  const revoke = useMutation(cancelInvitationMutation(row.invitation))

  return (
    <ConfirmDialog
      spec={open ? revokeConfirm(row) : null}
      pending={revoke.isPending}
      onConfirm={() => revoke.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
