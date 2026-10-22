import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/ui/alert-dialog'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  action: string
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
  returnTo?: RefObject<HTMLElement | null>
}

export function ConfirmDialog({
  open,
  title,
  description,
  action,
  pending,
  onConfirm,
  onClose,
  returnTo,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const returnFocus = useReturnFocus(open, returnTo)

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !pending && onClose()}>
      <AlertDialogContent onCloseAutoFocus={returnFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-anywhere">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t('confirm.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
