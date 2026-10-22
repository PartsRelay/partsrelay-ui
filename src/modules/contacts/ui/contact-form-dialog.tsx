import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  patchApiV1WorkspaceContactsContactId,
  postApiV1WorkspaceContacts,
} from '@/core/api/endpoints/contacts/contacts'
import { errorCode, errorMessage } from '@/core/errors'
import { useAppForm } from '@/form'
import {
  type Contact,
  validateContact,
  validateContactName,
} from '@/modules/contacts/core/contacts'
import { contactsKey } from '@/modules/contacts/core/contacts.query'
import { searchKeys } from '@/modules/searches/core/searches.query'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/ui/dialog'

type Props = { workspaceId: string; contact?: Contact; onClose: () => void }

export function ContactFormDialog({ workspaceId, contact, onClose }: Props) {
  const { t } = useTranslation()
  const opener = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  )
  const { client, pending, error, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { phone: '', name: contact?.name ?? '' },
    onSubmit: async ({ value }) => {
      if (pending) return
      if (contact) {
        const body = validateContactName(value.name)
        if (!body) return
        await run(
          async () => {
            await patchApiV1WorkspaceContactsContactId(String(contact.id), body)
            void client.invalidateQueries({ queryKey: searchKeys.all(workspaceId) })
            await client.invalidateQueries({ queryKey: contactsKey(workspaceId) })
            onClose()
          },
          { notice: 'contacts.notices.updated', silent: true }
        )
      } else {
        const { body } = validateContact(value.phone, value.name)
        if (!body) return
        await run(
          async () => {
            await postApiV1WorkspaceContacts(body)
            await client.invalidateQueries({ queryKey: contactsKey(workspaceId) })
            onClose()
          },
          { notice: 'contacts.notices.added', silent: true }
        )
      }
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <DialogContent
        className="contact-form-dialog"
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault()
            opener.current.focus()
          }
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {t(contact ? 'contacts.form.edit-title' : 'contacts.form.add-title')}
          </DialogTitle>
          <DialogDescription>
            {t(contact ? 'contacts.form.edit-description' : 'contacts.form.add-description')}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="contact-form">
            {!contact && (
              <form.AppField
                name="phone"
                validators={{
                  onSubmit: ({ value }) => validateContact(value, '').errors.phone ?? undefined,
                }}
              >
                {(field) => (
                  <field.InputField
                    label={t('contacts.form.phone')}
                    description={t('contacts.form.phone-hint')}
                    required
                    type="tel"
                    autoComplete="tel"
                    placeholder="+39 333 123 4567"
                    disabled={pending}
                  />
                )}
              </form.AppField>
            )}
            <form.AppField
              name="name"
              validators={{
                onSubmit: ({ value }) =>
                  validateContactName(value) ? undefined : 'contacts.form.name-error',
              }}
            >
              {(field) => (
                <field.InputField
                  label={t('contacts.form.name')}
                  description={t('contacts.form.name-hint')}
                  autoComplete="off"
                  maxLength={256}
                  disabled={pending}
                />
              )}
            </form.AppField>
            {error != null && (
              <p role="alert" className="contact-form-error">
                {errorCode(error) === 'VALIDATION_ERROR'
                  ? t('contacts.form.server-validation')
                  : t(...errorMessage(error))}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
                {t('contacts.actions.cancel')}
              </Button>
              <form.SubmitButton disabled={pending}>
                {t(contact ? 'contacts.actions.save' : 'contacts.actions.add')}
              </form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  )
}
