import { useMutation } from '@tanstack/react-query'
import type { RefObject } from 'react'
import { removeMemberConfirm } from '@/modules/workspaces/core/team'
import { removeMemberMutation } from '@/modules/workspaces/core/team.mutation'
import type { Member } from '@/modules/workspaces/core/workspace'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'

type RemoveMemberDialogProps = {
  member: Member
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RemoveMemberDialog({ member, open, onClose, returnTo }: RemoveMemberDialogProps) {
  const { workspace } = useMe()
  const remove = useMutation(removeMemberMutation(member))

  return (
    <ConfirmDialog
      spec={open ? removeMemberConfirm(member, workspace) : null}
      pending={remove.isPending}
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
