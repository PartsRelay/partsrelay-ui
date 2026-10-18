import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  blockConfirm,
  type ContactRow,
  removeContactConfirm,
} from '@/modules/core/contacts/contacts'
import {
  blockContactMutation,
  removeContactMutation,
  unblockContactMutation,
} from '@/modules/core/contacts/contacts.mutation'
import { ConfirmDialog } from '@/modules/ui/shared/confirm-dialog'
import { ActionButton } from '@/modules/ui/team/action-button'

type ContactActionsProps = { row: ContactRow; onRename: () => void }

export function ContactActions({ row, onRename }: ContactActionsProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState<'block' | 'remove' | null>(null)
  const { contact, actions, name } = row
  const block = useMutation(blockContactMutation(contact))
  const unblock = useMutation(unblockContactMutation(contact))
  const remove = useMutation(removeContactMutation(contact))
  const confirmations = {
    block: { spec: () => blockConfirm(row), run: () => block.mutate() },
    remove: { spec: () => removeContactConfirm(row), run: () => remove.mutate() },
  }
  const confirmation = confirming && confirmations[confirming]

  return (
    <div className="flex items-center gap-3">
      {actions.rename && (
        <ActionButton aria-label={t('contacts.actions.renameContact', { name })} onClick={onRename}>
          {t('contacts.actions.rename')}
        </ActionButton>
      )}
      {actions.block && (
        <ActionButton
          aria-label={t('contacts.actions.blockContact', { name })}
          onClick={() => setConfirming('block')}
        >
          {t('contacts.actions.block')}
        </ActionButton>
      )}
      {actions.unblock && (
        <ActionButton
          aria-label={t('contacts.actions.unblockContact', { name })}
          disabled={unblock.isPending}
          onClick={() => unblock.mutate()}
        >
          {t('contacts.actions.unblock')}
        </ActionButton>
      )}
      {actions.remove && (
        <ActionButton
          aria-label={t('contacts.actions.removeContact', { name })}
          onClick={() => setConfirming('remove')}
        >
          {t('contacts.actions.remove')}
        </ActionButton>
      )}
      <ConfirmDialog
        spec={confirmation ? confirmation.spec() : null}
        onConfirm={() => {
          setConfirming(null)
          confirmation?.run()
        }}
        onClose={() => setConfirming(null)}
      />
    </div>
  )
}
