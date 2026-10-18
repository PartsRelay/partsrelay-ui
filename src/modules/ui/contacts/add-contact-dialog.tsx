import { useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createContactForm } from '@/modules/core/contacts/contact-form'
import { createContactMutation } from '@/modules/core/contacts/contacts.mutation'
import { Callout } from '@/modules/ui/shared/callout'
import { TextField } from '@/modules/ui/shared/text-field'
import { useT } from '@/modules/ui/shared/use-t'
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
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

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
  const translate = useT()
  const [form] = useState(createContactForm)
  const { phone, name, errors, failure } = useSelector(form)
  const create = useMutation(createContactMutation)
  const phoneInput = useRef<HTMLInputElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const focus = (field: 'phone' | 'name') =>
    (field === 'phone' ? phoneInput : nameInput).current?.focus()

  return (
    <form
      noValidate
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        const contact = form.actions.submit()
        if (!contact) {
          focus(form.state.errors.phone ? 'phone' : 'name')

          return
        }

        create.mutate(contact, {
          onSuccess: onDone,
          onError: (error) => {
            const field = form.actions.failed(error)
            if (field) focus(field)
          },
        })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('contacts.add.title')}</DialogTitle>
        <DialogDescription>{t('contacts.add.description')}</DialogDescription>
      </DialogHeader>
      {failure && <Callout tone="danger">{translate(failure)}</Callout>}
      <TextField
        label={t('contacts.add.phone')}
        required
        description={t('contacts.add.phoneHint')}
        error={errors.phone && translate(errors.phone)}
      >
        <Input
          ref={phoneInput}
          type="tel"
          autoComplete="off"
          placeholder={t('contacts.add.phonePlaceholder')}
          value={phone}
          onChange={(event) => form.actions.setPhone(event.target.value)}
        />
      </TextField>
      <TextField
        label={t('contacts.add.name')}
        description={t('contacts.add.nameHint')}
        error={errors.name && translate(errors.name)}
      >
        <Input
          ref={nameInput}
          autoComplete="off"
          value={name}
          onChange={(event) => form.actions.setName(event.target.value)}
        />
      </TextField>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">{t('confirm.cancel')}</Button>
        </DialogClose>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending && <Spinner data-icon="inline-start" />}
          {t('contacts.add.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
