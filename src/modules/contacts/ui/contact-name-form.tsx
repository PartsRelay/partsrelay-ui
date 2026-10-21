import { useTranslation } from 'react-i18next'
import { useAppForm } from '@/form'
import { CONTACT_NAME_MAX, renameChange } from '@/modules/contacts/core/contact-form'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { useUpdateContact } from '@/modules/contacts/ui/hooks/use-update-contact'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldGroup } from '@/ui/components/ui/field'

type ContactNameFormProps = { row: ContactRow; onDone: () => void }

export function ContactNameForm({ row, onDone }: ContactNameFormProps) {
  const { t } = useTranslation()
  const update = useUpdateContact()
  const { contact } = row
  const form = useAppForm({
    defaultValues: { name: contact.name ?? '' },
    // The row shows the new name before the core answers
    onSubmit: ({ value }) => {
      const change = renameChange(value.name, contact)
      onDone()
      if (change) update.mutate({ contact, change })
    },
  })

  return (
    <form.AppForm>
      <form.Form className="min-w-56 whitespace-normal">
        <FieldGroup className="gap-3">
          <form.AppField name="name">
            {(field) => (
              <field.InputField
                label={t('contacts.rename.label', { name: row.name })}
                description={t('contacts.rename.hint')}
                autoFocus
                autoComplete="off"
                maxLength={CONTACT_NAME_MAX}
                placeholder={contact.profileName ?? row.phone}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') onDone()
                }}
              />
            )}
          </form.AppField>
          <Field orientation="horizontal">
            <form.SubmitButton size="sm">{t('contacts.rename.save')}</form.SubmitButton>
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
              {t('confirm.cancel')}
            </Button>
          </Field>
        </FieldGroup>
      </form.Form>
    </form.AppForm>
  )
}
