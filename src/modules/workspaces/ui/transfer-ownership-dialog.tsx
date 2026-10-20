import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transferAction, transferCandidates } from '@/modules/workspaces/core/team'
import { transferOwnershipMutation } from '@/modules/workspaces/core/team.mutation'
import { roleLabel } from '@/modules/workspaces/core/role'
import type { Member } from '@/modules/workspaces/core/workspace'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { TextField } from '@/ui/components/text-field'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import { useT } from '@/ui/hooks/use-t'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog'
import { Button } from '@/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select'

type TransferOwnershipDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

export function TransferOwnershipDialog({ open, onOpenChange }: TransferOwnershipDialogProps) {
  const returnFocus = useReturnFocus(open)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onCloseAutoFocus={returnFocus}>
        <TransferForm onDone={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const translate = useT()
  const { workspace, me } = useMe()
  const candidates = transferCandidates(workspace, me)
  const [candidateId, setCandidateId] = useState('')
  const candidate = candidates.find((member) => member.id === candidateId)
  const transfer = useMutation(transferOwnershipMutation)
  const candidateLabel = (member: Member) =>
    t('team.transfer.candidate', { name: member.name, role: translate(roleLabel(member.role)) })

  return (
    <form
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (candidate) transfer.mutate(candidate, { onSuccess: onDone })
      }}
    >
      <AlertDialogHeader>
        <AlertDialogTitle>{t('team.transfer.title')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t(candidates.length > 0 ? 'team.transfer.description' : 'team.transfer.nobody')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      {candidates.length > 0 && (
        <Select value={candidateId} onValueChange={setCandidateId}>
          <TextField label={t('team.transfer.newOwner')}>
            <SelectTrigger className="w-full min-w-0 *:data-[slot=select-value]:min-w-0">
              <SelectValue placeholder={t('team.transfer.choose')}>
                {candidate && <span className="truncate">{candidateLabel(candidate)}</span>}
              </SelectValue>
            </SelectTrigger>
          </TextField>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            {candidates.map((member) => (
              <SelectItem key={member.id} value={member.id} className="wrap-anywhere">
                {candidateLabel(member)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
        <Button
          type="submit"
          className="h-auto min-h-8 whitespace-normal wrap-anywhere"
          disabled={!candidate || transfer.isPending}
        >
          {translate(transferAction(candidate))}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
