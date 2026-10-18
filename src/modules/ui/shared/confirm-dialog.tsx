import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canConfirm, type ConfirmSpec } from '@/modules/core/shared/confirm'
import { Facts } from '@/modules/ui/shared/facts'
import { useReturnFocus } from '@/modules/ui/shared/use-return-focus'
import { useT } from '@/modules/ui/shared/use-t'
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
}

export function ConfirmDialog({ spec, pending, onConfirm, onClose }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const translate = useT()
  const [typed, setTyped] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const returnFocus = useReturnFocus(spec !== null)
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
