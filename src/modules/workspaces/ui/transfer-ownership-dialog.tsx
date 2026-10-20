import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { transferAction, transferCandidates } from '@/modules/workspaces/core/team'
import { roleLabel } from '@/modules/workspaces/core/role'
import type { Member } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { TextField } from '@/ui/components/text-field'
import { useAction } from '@/ui/hooks/use-action'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/ui/alert-dialog'
import { Button } from '@/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

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
  const { workspace, me } = useMe()
  const candidates = transferCandidates(workspace, me)
  const [candidateId, setCandidateId] = useState('')
  const candidate = candidates.find((member) => member.id === candidateId)
  const { client, pending, run } = useAction()
  const candidateLabel = (member: Member) =>
    t('team.transfer.candidate', { name: member.name, role: t(...roleLabel(member.role)) })

  return (
    <form
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!candidate) return

        const result = await run(
          async () => {
            try {
              await authClient.organization.updateMemberRole({
                memberId: candidate.id,
                role: 'owner',
              })
            } finally {
              // The core hands the old owner admin rights
              await Promise.all([
                client.invalidateQueries({ queryKey: workspaceKey }),
                client.invalidateQueries({ queryKey: sessionQuery.queryKey }),
              ])
            }
          },
          { notice: message('team.notices.ownershipTransferred', { name: candidate.name }) }
        )
        if (result.ok) onDone()
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
          disabled={!candidate || pending}
        >
          {t(...transferAction(candidate))}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
