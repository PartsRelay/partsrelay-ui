import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MemberRow, removeMemberConfirm } from '@/modules/core/team/team'
import { removeMemberMutation } from '@/modules/core/team/team.mutation'
import { useMe } from '@/modules/ui/app/use-me'
import { ConfirmDialog } from '@/modules/ui/shared/confirm-dialog'
import { ActionButton } from '@/modules/ui/team/action-button'
import { ChangeRoleDialog } from '@/modules/ui/team/change-role-dialog'

type MemberActionsProps = { row: MemberRow; onTransfer: () => void }

export function MemberActions({ row, onTransfer }: MemberActionsProps) {
  const { t } = useTranslation()
  const { workspace } = useMe()
  const [dialog, setDialog] = useState<'role' | 'remove' | null>(null)
  const remove = useMutation(removeMemberMutation(row.member))
  const close = () => setDialog(null)
  const { member, roleOptions } = row

  if (!row.canTransfer && !roleOptions && !row.canRemove) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {row.canTransfer && (
        <ActionButton onClick={onTransfer}>{t('team.actions.transfer')}</ActionButton>
      )}
      {roleOptions && (
        <>
          <ActionButton
            aria-label={t('team.actions.changeRoleOf', { name: member.name })}
            onClick={() => setDialog('role')}
          >
            {t('team.actions.changeRole')}
          </ActionButton>
          <ChangeRoleDialog
            member={member}
            roles={roleOptions}
            open={dialog === 'role'}
            onOpenChange={(open) => setDialog(open ? 'role' : null)}
          />
        </>
      )}
      {row.canRemove && (
        <ActionButton
          aria-label={t('team.actions.removeMember', { name: member.name })}
          onClick={() => setDialog('remove')}
        >
          {t('team.actions.remove')}
        </ActionButton>
      )}
      <ConfirmDialog
        spec={dialog === 'remove' ? removeMemberConfirm(member, workspace) : null}
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: close })}
        onClose={close}
      />
    </div>
  )
}
