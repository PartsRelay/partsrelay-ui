import { type RefObject, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { can, type ConfirmSpec } from '@/core/confirm'
import { Facts } from '@/ui/components/facts'
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
import { Checkbox } from '@/ui/components/ui/checkbox'
import { Field, FieldLabel } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'

type ConfirmDialogProps = {
  spec: ConfirmSpec | null
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
  returnTo?: RefObject<HTMLElement | null>
}

export function ConfirmDialog({ spec, pending, onConfirm, onClose, returnTo }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const [typed, setTyped] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const returnFocus = useReturnFocus(spec !== null, returnTo)
  const typedId = useId()
  const acknowledgeId = useId()

  return (
    <AlertDialog
      open={spec !== null}
      onOpenChange={(open) => {
        if (open) return
        setTyped('')
        setAcknowledged(false)
        onClose()
      }}
    >
      {spec && (
        <AlertDialogContent onCloseAutoFocus={returnFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-anywhere">{t(...spec.title)}</AlertDialogTitle>
            <AlertDialogDescription>{t(...spec.body)}</AlertDialogDescription>
          </AlertDialogHeader>
          {spec.facts && (
            <Facts
              className="text-sm"
              items={spec.facts.map(({ label, value }) => ({
                label: t(...label),
                value: typeof value === 'string' ? value : t(...value),
              }))}
            />
          )}
          {spec.typeToConfirm !== undefined && (
            <Field>
              <FieldLabel htmlFor={typedId}>
                {t('confirm.type-to-confirm', { text: spec.typeToConfirm })}
              </FieldLabel>
              <Input
                id={typedId}
                autoComplete="off"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </Field>
          )}
          {spec.acknowledge && (
            <Field orientation="horizontal">
              <Checkbox
                id={acknowledgeId}
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <FieldLabel htmlFor={acknowledgeId}>{t(...spec.acknowledge)}</FieldLabel>
            </Field>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant={spec.tone === 'danger' ? 'destructive' : 'default'}
              disabled={pending || !can(spec, typed, acknowledged)}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
            >
              {t(...spec.action)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
