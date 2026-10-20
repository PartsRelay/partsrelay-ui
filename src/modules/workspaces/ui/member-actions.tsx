import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MemberRow } from '@/modules/workspaces/core/team'
import { ActionButton } from '@/modules/workspaces/ui/action-button'
import { ChangeRoleDialog } from '@/modules/workspaces/ui/change-role-dialog'

type MemberActionsProps = { row: MemberRow; onTransfer: () => void; onRemove: () => void }

export function MemberActions({ row, onTransfer, onRemove }: MemberActionsProps) {
  const { t } = useTranslation()
  const [changingRole, setChangingRole] = useState(false)
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
            aria-label={t('team.actions.change-role-of', { name: member.name })}
            onClick={() => setChangingRole(true)}
          >
            {t('team.actions.change-role')}
          </ActionButton>
          <ChangeRoleDialog
            member={member}
            roles={roleOptions}
            open={changingRole}
            onOpenChange={setChangingRole}
          />
        </>
      )}
      {row.canRemove && (
        <ActionButton
          aria-label={t('team.actions.remove-member', { name: member.name })}
          onClick={onRemove}
        >
          {t('team.actions.remove')}
        </ActionButton>
      )}
    </div>
  )
}
