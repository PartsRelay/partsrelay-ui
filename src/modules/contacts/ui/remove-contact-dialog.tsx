import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { useRemoveContact } from '@/modules/contacts/ui/hooks/use-remove-contact'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'

type RemoveContactDialogProps = {
  row: ContactRow
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RemoveContactDialog({ row, open, onClose, returnTo }: RemoveContactDialogProps) {
  const { t } = useTranslation()
  const remove = useRemoveContact()

  return (
    <ConfirmDialog
      open={open}
      title={t('contacts.confirm.remove.title', { name: row.name })}
      description={t('contacts.confirm.remove.body', { phone: row.phone })}
      action={t('contacts.confirm.remove.action')}
      pending={remove.isPending}
      onConfirm={() => remove.mutate(row.contact, { onSuccess: onClose })}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
