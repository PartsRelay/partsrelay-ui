import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { useUpdateContact } from '@/modules/contacts/ui/hooks/use-update-contact'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'

type BlockContactDialogProps = {
  row: ContactRow
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function BlockContactDialog({ row, open, onClose, returnTo }: BlockContactDialogProps) {
  const { t } = useTranslation()
  const update = useUpdateContact()

  return (
    <ConfirmDialog
      open={open}
      title={t('contacts.confirm.block.title', { name: row.name })}
      description={t('contacts.confirm.block.body', { phone: row.phone })}
      action={t('contacts.confirm.block.action')}
      pending={update.isPending}
      onConfirm={() =>
        update.mutate(
          { contact: row.contact, change: { status: 'blocked' } },
          { onSuccess: onClose }
        )
      }
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
