import { MailCheckIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInterval } from 'usehooks-ts'
import { authClient } from '@/modules/auth/core/auth.client'
import { emailError, MAGIC_LINK_MINUTES, resendWait } from '@/modules/auth/core/magic-link'
import { magicLinkSignIn, type SignInFlow } from '@/modules/auth/core/sign-in'
import { useClearSignInError } from '@/modules/auth/ui/hooks/use-clear-sign-in-error'
import { errorCode, errorKey } from '@/core/errors'
import { useAppForm } from '@/form'
import { Callout } from '@/ui/components/callout'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Field, FieldGroup } from '@/ui/components/ui/field'
import { Spinner } from '@/ui/components/ui/spinner'

export function MagicLinkForm({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  const [sent, setSent] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const { pending, run } = useBetterAuthAction()
  const clearSignInError = useClearSignInError()
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

  useInterval(() => setNow(Date.now()), wait > 0 ? 1000 : null)

  // Errors show in the form, not as a toast
  const send = async (address: string) => {
    const result = await run(() => authClient.signIn.magicLink(magicLinkSignIn(flow, address)), {
      silent: true,
    })
    if (!result.ok) return errorKey(errorCode(result.error))

    const at = Date.now()
    setNow(at)
    setSent(address)
    setSentAt(at)

    return null
  }

  const form = useAppForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value, formApi }) => {
      const error = await send(value.email.trim().toLowerCase())
      if (error) formApi.setErrorMap({ onSubmit: { fields: { email: error } } })
      else await clearSignInError()
    },
  })

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
        {failure && <Callout tone="danger">{t(failure)}</Callout>}
        <div className="grid gap-2">
          <Button
            variant="outline"
            aria-disabled={waiting}
            className="aria-disabled:opacity-50"
            onClick={async () => {
              if (!waiting) setFailure(await send(sent))
            }}
          >
            {pending && <Spinner data-icon="inline-start" />}
            {wait > 0
              ? t('login.magic-link.sent.resend-in', { seconds: wait })
              : t('login.magic-link.sent.resend')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSent(null)
              setSentAt(null)
              setFailure(null)
            }}
          >
            {t('login.magic-link.sent.edit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form.AppForm>
      <form.Form>
        <FieldGroup>
          <form.AppField name="email" validators={{ onSubmit: ({ value }) => emailError(value) }}>
            {(field) => (
              <field.InputField
                ref={input}
                label={t('login.magic-link.email')}
                type="email"
                autoComplete="email"
                placeholder={t('login.magic-link.placeholder')}
              />
            )}
          </form.AppField>
          <Field>
            <form.SubmitButton variant="outline">{t('login.magic-link.send')}</form.SubmitButton>
          </Field>
        </FieldGroup>
      </form.Form>
    </form.AppForm>
  )
}
