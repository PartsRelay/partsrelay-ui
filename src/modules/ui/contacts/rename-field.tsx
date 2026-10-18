import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/core/contacts/contacts'
import { renameContactMutation } from '@/modules/core/contacts/contacts.mutation'
import { type ContactRename, renameKeyAction } from '@/modules/core/contacts/rename'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldDescription, FieldError } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'

type RenameFieldProps = { row: ContactRow; rename: ContactRename }

export function RenameField({ row, rename }: RenameFieldProps) {
  const { t } = useTranslation()
  const translate = useT()
  const hint = useId()
  const { draft, error } = useSelector(rename, (state) => state)
  const save = useMutation(renameContactMutation(row.contact))

  const commit = () => {
    const change = rename.actions.commit(row.contact)
    if (change) save.mutate(change.name)
  }

  return (
    <Field data-invalid={error !== null || undefined} className="min-w-56 whitespace-normal">
      <Input
        autoFocus
        aria-label={t('contacts.rename.label', { name: row.name })}
        aria-invalid={error !== null || undefined}
        aria-describedby={hint}
        placeholder={row.contact.profileName ?? row.phone}
        value={draft}
        onChange={(event) => rename.actions.change(event.target.value)}
        onKeyDown={(event) => {
          const action = renameKeyAction(event.key)
          if (action === 'save') commit()
          if (action === 'cancel') rename.actions.cancel()
        }}
      />
      {error ? (
        <FieldError id={hint}>{translate(error)}</FieldError>
      ) : (
        <FieldDescription id={hint}>{t('contacts.rename.hint')}</FieldDescription>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={commit}>
          {t('contacts.rename.save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => rename.actions.cancel()}>
          {t('confirm.cancel')}
        </Button>
      </div>
    </Field>
  )
}
