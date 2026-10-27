import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { useUpdateContact } from '@/modules/contacts/ui/hooks/use-update-contact'
import { ActionButton } from '@/ui/components/action-button'

type ContactActionsProps = {
  row: ContactRow
  renameRef?: Ref<HTMLButtonElement>
  onRename: () => void
  onBlock: () => void
  onRemove: () => void
}

export function ContactActions({
  row,
  renameRef,
  onRename,
  onBlock,
  onRemove,
}: ContactActionsProps) {
  const { t } = useTranslation()
  const update = useUpdateContact()
  const { contact, actions, name } = row

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {actions.rename && (
        <ActionButton
          ref={renameRef}
          aria-label={t('contacts.actions.rename-contact', { name })}
          onClick={onRename}
        >
          {t('contacts.actions.rename')}
        </ActionButton>
      )}
      {actions.block ? (
        <ActionButton aria-label={t('contacts.actions.block-contact', { name })} onClick={onBlock}>
          {t('contacts.actions.block')}
        </ActionButton>
      ) : (
        actions.unblock && (
          <ActionButton
            aria-label={t('contacts.actions.unblock-contact', { name })}
            aria-disabled={update.isPending}
            onClick={() => {
              if (!update.isPending) update.mutate({ contact, change: { status: 'active' } })
            }}
          >
            {t('contacts.actions.unblock')}
          </ActionButton>
        )
      )}
      {actions.remove && (
        <ActionButton
          aria-label={t('contacts.actions.remove-contact', { name })}
          onClick={onRemove}
        >
          {t('contacts.actions.remove')}
        </ActionButton>
      )}
    </div>
  )
}
