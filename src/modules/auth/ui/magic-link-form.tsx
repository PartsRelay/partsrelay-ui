import { useSelector } from '@tanstack/react-store'
import { MailCheckIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { createMagicLinkForm, MAGIC_LINK_MINUTES, resendWait } from '@/modules/auth/core/magic-link'
import { magicLinkSignIn, type SignInFlow } from '@/modules/auth/core/sign-in'
import { errorMessage } from '@/core/errors'
import { localeHeaders } from '@/i18n'
import { Callout } from '@/ui/components/callout'
import { TextField } from '@/ui/components/text-field'
import { useAction } from '@/ui/hooks/use-action'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Input } from '@/ui/components/ui/input'
import { Spinner } from '@/ui/components/ui/spinner'

export function MagicLinkForm({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  const [form] = useState(createMagicLinkForm)
  const { email, sent, sentAt, error } = useSelector(form)
  const { pending, run } = useAction()
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

  // Errors show in the form, not as a toast
  const deliver = async (address: string) => {
    const result = await run(
      () =>
        authClient.signIn.magicLink({
          ...magicLinkSignIn(flow, address),
          fetchOptions: { headers: localeHeaders() },
        }),
      { silent: true }
    )
    if (!result.ok) return form.actions.failed(errorMessage(result.error))

    const at = Date.now()
    setNow(at)
    form.actions.sent(address, at)
  }

  if (sent) {
    const waiting = wait > 0 || pending

    return (
      <div className="grid gap-4">
        <Callout
          ref={status}
          role="status"
          tabIndex={-1}
          className="outline-none"
          icon={MailCheckIcon}
          title={t('login.magic-link.sent.title')}
        >
          {t('login.magic-link.sent.description', { email: sent, minutes: MAGIC_LINK_MINUTES })}
        </Callout>
        {error && <Callout tone="danger">{t(...error)}</Callout>}
        <div className="grid gap-2">
          <Button
            variant="outline"
            aria-disabled={waiting}
            className="aria-disabled:opacity-50"
            onClick={() => !waiting && void deliver(sent)}
          >
            {pending && <Spinner data-icon="inline-start" />}
            {wait > 0
              ? t('login.magic-link.sent.resend-in', { seconds: wait })
              : t('login.magic-link.sent.resend')}
          </Button>
          <Button variant="ghost" onClick={form.actions.edit}>
            {t('login.magic-link.sent.edit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        const address = form.actions.submit()
        if (address) void deliver(address)
        else input.current?.focus()
      }}
    >
      <FieldGroup>
        <TextField label={t('login.magic-link.email')} error={error && t(...error)}>
          <Input
            ref={input}
            type="email"
            autoComplete="email"
            placeholder={t('login.magic-link.placeholder')}
            value={email}
            onChange={(event) => form.actions.setEmail(event.target.value)}
          />
        </TextField>
        <Field>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            {t('login.magic-link.send')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
