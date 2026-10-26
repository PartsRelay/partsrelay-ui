import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { limitedText, requiredText, useAppForm } from '@/form'
import { fieldErrors } from '@/core/errors'
import { contactFieldErrors, emptyContact, newContact } from '@/modules/contacts/core/contact-form'
import { useAddContact } from '@/modules/contacts/ui/hooks/use-add-contact'
import { Button } from '@/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/components/ui/dialog'
import { FieldGroup } from '@/ui/components/ui/field'

export function AddContactDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          {t('contacts.add.open')}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <AddContactForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddContactForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const add = useAddContact()
  const form = useAppForm({
    defaultValues: emptyContact,
    onSubmit: async ({ value, formApi }) => {
      try {
        await add.mutateAsync(newContact(value))
        onDone()
      } catch (error) {
        const fields = fieldErrors(error, contactFieldErrors)
        if (fields) formApi.setErrorMap({ onSubmit: { fields } })
      }
    },
  })

  return (
    <form.AppForm>
      <form.Form className="grid gap-6">
        <DialogHeader>
          <DialogTitle>{t('contacts.add.title')}</DialogTitle>
          <DialogDescription>{t('contacts.add.description')}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {/* The core checks the number, resubmitting clears its error */}
          <form.AppField
            name="phone"
            validators={{ onSubmit: requiredText('contacts.add.errors.phone-required') }}
          >
            {(field) => (
              <field.InputField
                label={t('contacts.add.phone')}
                required
                description={t('contacts.add.phone-hint')}
                type="tel"
                autoComplete="off"
                placeholder={t('contacts.add.phone-placeholder')}
              />
            )}
          </form.AppField>
          <form.AppField name="name" validators={{ onSubmit: limitedText }}>
            {(field) => (
              <field.InputField
                label={t('contacts.add.name')}
                description={t('contacts.add.name-hint')}
                autoComplete="off"
              />
            )}
          </form.AppField>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('confirm.cancel')}</Button>
          </DialogClose>
          <form.SubmitButton>{t('contacts.add.submit')}</form.SubmitButton>
        </DialogFooter>
      </form.Form>
    </form.AppForm>
  )
}
