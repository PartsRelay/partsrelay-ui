import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { useSelector } from '@tanstack/react-store'
import { MailCheckIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createMagicLinkForm, MAGIC_LINK_MINUTES, resendWait } from '@/modules/auth/core/magic-link'
import { errorMessage } from '@/core/errors'
import { Callout } from '@/ui/components/callout'
import { TextField } from '@/ui/components/text-field'
import { useT } from '@/ui/hooks/use-t'
import { Button } from '@/ui/components/button'
import { Input } from '@/ui/components/input'
import { Spinner } from '@/ui/components/spinner'

type MagicLinkFormProps = { send: UseMutationOptions<unknown, Error, string> }

export function MagicLinkForm({ send }: MagicLinkFormProps) {
  const { t } = useTranslation()
  const translate = useT()
  const [form] = useState(createMagicLinkForm)
  const { email, sent, sentAt, error } = useSelector(form)
  const mutation = useMutation(send)
  const [now, setNow] = useState(Date.now)
  const wait = resendWait(sentAt, now)
  const input = useRef<HTMLInputElement>(null)
  const status = useRef<HTMLDivElement>(null)
  const wasSent = useRef(false)

  // Keeps focus on screen when the form and status swap
  useEffect(() => {
    if (sent) status.current?.focus()
    else if (wasSent.current) input.current?.focus()
    wasSent.current = sent !== null
  }, [sent])

  useEffect(() => {
    if (wait === 0) return

    const tick = setTimeout(() => setNow(Date.now()), 1000)

    return () => clearTimeout(tick)
  }, [wait, now])

  const deliver = (address: string) =>
    mutation.mutate(address, {
      onSuccess: () => {
        const at = Date.now()
        setNow(at)
        form.actions.sent(address, at)
      },
      onError: (failure) => form.actions.failed(errorMessage(failure)),
    })

  if (sent) {
    const waiting = wait > 0 || mutation.isPending

    return (
      <div className="grid gap-4">
        <Callout
          ref={status}
          role="status"
          tabIndex={-1}
          className="outline-none"
          icon={MailCheckIcon}
          title={t('login.magicLink.sent.title')}
        >
          {t('login.magicLink.sent.description', { email: sent, minutes: MAGIC_LINK_MINUTES })}
        </Callout>
        {error && <Callout tone="danger">{translate(error)}</Callout>}
        <div className="grid gap-2">
          <Button
            variant="outline"
            aria-disabled={waiting}
            className="aria-disabled:opacity-50"
            onClick={() => !waiting && deliver(sent)}
          >
            {mutation.isPending && <Spinner data-icon="inline-start" />}
            {wait > 0
              ? t('login.magicLink.sent.resendIn', { seconds: wait })
              : t('login.magicLink.sent.resend')}
          </Button>
          <Button variant="ghost" onClick={form.actions.edit}>
            {t('login.magicLink.sent.edit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const address = form.actions.submit()
        if (address) deliver(address)
        else input.current?.focus()
      }}
    >
      <TextField label={t('login.magicLink.email')} error={error && translate(error)}>
        <Input
          ref={input}
          type="email"
          autoComplete="email"
          placeholder={t('login.magicLink.placeholder')}
          value={email}
          onChange={(event) => form.actions.setEmail(event.target.value)}
        />
      </TextField>
      <Button type="submit" variant="outline" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Spinner data-icon="inline-start" />}
        {t('login.magicLink.send')}
      </Button>
    </form>
  )
}
