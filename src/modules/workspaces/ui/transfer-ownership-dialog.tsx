import { useSelector } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { sessionQuery } from '@/modules/auth/core/session.query'
import {
  type Member,
  transferAction,
  transferCandidates,
} from '@/modules/workspaces/core/workspace'
import { roleLabel } from '@/modules/workspaces/core/role'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useAppForm } from '@/form'
import { TextField } from '@/ui/components/text-field'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
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
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { candidateId: '' },
    onSubmit: async ({ value }) => {
      const candidate = candidates.find((member) => member.id === value.candidateId)
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
        { notice: 'workspace.notices.ownership-transferred', values: { name: candidate.name } }
      )
      if (result.ok) onDone()
    },
  })
  const candidateId = useSelector(form.store, (state) => state.values.candidateId)
  const candidate = candidates.find((member) => member.id === candidateId)
  const candidateLabel = (member: Member) =>
    t('workspace.transfer.candidate', { name: member.name, role: t(...roleLabel(member.role)) })

  return (
    <form.AppForm>
      <form.Form className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('workspace.transfer.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              candidates.length > 0 ? 'workspace.transfer.description' : 'workspace.transfer.nobody'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {candidates.length > 0 && (
          <form.Field name="candidateId">
            {(field) => (
              <Select value={field.state.value} onValueChange={field.handleChange}>
                <TextField label={t('workspace.transfer.new-owner')}>
                  <SelectTrigger className="w-full min-w-0 *:data-[slot=select-value]:min-w-0">
                    <SelectValue placeholder={t('workspace.transfer.choose')}>
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
          </form.Field>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
          <form.SubmitButton
            className="h-auto min-h-8 whitespace-normal wrap-anywhere"
            disabled={!candidate}
          >
            {t(...transferAction(candidate))}
          </form.SubmitButton>
        </AlertDialogFooter>
      </form.Form>
    </form.AppForm>
  )
}
