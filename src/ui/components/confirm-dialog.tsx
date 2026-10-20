import { type RefObject, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canConfirm, type ConfirmSpec } from '@/core/confirm'
import { Facts } from '@/ui/components/facts'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import { useT } from '@/ui/hooks/use-t'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog'
import { Checkbox } from '@/ui/components/checkbox'
import { Field, FieldLabel } from '@/ui/components/field'
import { Input } from '@/ui/components/input'

type ConfirmDialogProps = {
  spec: ConfirmSpec | null
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
  returnTo?: RefObject<HTMLElement | null>
}

export function ConfirmDialog({ spec, pending, onConfirm, onClose, returnTo }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const translate = useT()
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
            <AlertDialogTitle className="wrap-anywhere">{translate(spec.title)}</AlertDialogTitle>
            <AlertDialogDescription>{translate(spec.body)}</AlertDialogDescription>
          </AlertDialogHeader>
          {spec.facts && (
            <Facts
              className="text-sm"
              items={spec.facts.map(({ label, value }) => ({
                label: translate(label),
                value: typeof value === 'string' ? value : translate(value),
              }))}
            />
          )}
          {spec.typeToConfirm !== undefined && (
            <Field>
              <FieldLabel htmlFor={typedId}>
                {t('confirm.typeToConfirm', { text: spec.typeToConfirm })}
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
              <FieldLabel htmlFor={acknowledgeId}>{translate(spec.acknowledge)}</FieldLabel>
            </Field>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant={spec.tone === 'danger' ? 'destructive' : 'default'}
              disabled={pending || !canConfirm(spec, typed, acknowledged)}
              onClick={(event) => {
                event.preventDefault()
                onConfirm()
              }}
            >
              {translate(spec.action)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
