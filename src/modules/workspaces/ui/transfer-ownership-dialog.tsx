import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transferAction, transferCandidates } from '@/modules/workspaces/core/team'
import { transferOwnershipMutation } from '@/modules/workspaces/core/team.mutation'
import { roleLabel } from '@/modules/workspaces/core/role'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { TextField } from '@/ui/components/text-field'
import { useReturnFocus } from '@/ui/components/use-return-focus'
import { useT } from '@/ui/components/use-t'
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

  return (
    <form
      className="grid gap-4"
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
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('team.transfer.choose')} />
            </SelectTrigger>
          </TextField>
          <SelectContent>
            {candidates.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {t('team.transfer.candidate', {
                  name: member.name,
                  role: translate(roleLabel(member.role)),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
        <Button type="submit" disabled={!candidate || transfer.isPending}>
          {translate(transferAction(candidate))}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
