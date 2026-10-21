import { useTranslation } from 'react-i18next'
import type { MemberRow } from '@/modules/workspaces/core/workspace'
import { ActionButton } from '@/modules/workspaces/ui/action-button'

type MemberActionsProps = { row: MemberRow; onTransfer: () => void; onRemove: () => void }

export function MemberActions({ row, onTransfer, onRemove }: MemberActionsProps) {
  const { t } = useTranslation()
  const { member } = row

  if (!row.canTransfer && !row.canRemove) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {row.canTransfer && (
        <ActionButton onClick={onTransfer}>{t('workspace.actions.transfer')}</ActionButton>
      )}
      {row.canRemove && (
        <ActionButton
          aria-label={t('workspace.actions.remove-member', { name: member.name })}
          onClick={onRemove}
        >
          {t('workspace.actions.remove')}
        </ActionButton>
      )}
    </div>
  )
}
