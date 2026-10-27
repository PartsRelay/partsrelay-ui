import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { renameChange } from '@/modules/contacts/core/contact-form'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { useUpdateContact } from '@/modules/contacts/ui/hooks/use-update-contact'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldGroup } from '@/ui/components/ui/field'

type ContactNameFormProps = { row: ContactRow; onDone: () => void }

export function ContactNameForm({ row, onDone }: ContactNameFormProps) {
  const { t } = useTranslation()
  const update = useUpdateContact()
  const { contact } = row
  const form = useForm({
    defaultValues: { name: contact.name ?? '' },
    onSubmit: ({ value }) => {
      const change = renameChange(value.name, contact)
      onDone()
      if (change) update.mutate({ contact, change })
    },
  })

  return (
    <Form form={form} className="min-w-56 whitespace-normal">
      <FieldGroup className="gap-3">
        <form.Field name="name">
          {(field) => (
            <InputField
              field={field}
              label={t('contacts.rename.label', { name: row.name })}
              description={t('contacts.rename.hint')}
              autoFocus
              autoComplete="off"
              placeholder={contact.profileName ?? row.phone}
              onKeyDown={(event) => {
                if (event.key === 'Escape') onDone()
              }}
            />
          )}
        </form.Field>
        <Field orientation="horizontal">
          <SubmitButton form={form} size="sm">
            {t('contacts.rename.save')}
          </SubmitButton>
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            {t('confirm.cancel')}
          </Button>
        </Field>
      </FieldGroup>
    </Form>
  )
}
