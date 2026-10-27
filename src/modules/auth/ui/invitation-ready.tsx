import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import {
  acceptError,
  type InvitationDetails,
  invitedNameSchema,
} from '@/modules/auth/core/invitation'
import { currentCompanyKey } from '@/modules/auth/core/invitation.query'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import { Callout } from '@/ui/components/callout'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent } from '@/ui/components/ui/card'

type InvitationReadyProps = {
  details: InvitationDetails
  confirm: boolean
  email: string | null
  askName: boolean
  invitationId: string
}

export function InvitationReady({
  details,
  confirm,
  email,
  askName,
  invitationId,
}: InvitationReadyProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { client, pending, error, run } = useBetterAuthAction()
  const [confirming, setConfirming] = useState(false)
  const failure = error ? acceptError(error) : null
  const joinNow = async (name: string) => {
    const result = await run(
      async () => {
        if (askName) await authClient.updateUser({ name: name.trim() })
        await authClient.organization.acceptInvitation({ invitationId })
      },
      {
        notice: 'invitation.notices.joined',
        values: { workspace: details.workspace },
        silent: true,
      }
    )
    if (!result.ok) {
      setConfirming(false)
      return client.invalidateQueries({ queryKey: currentCompanyKey })
    }

    client.removeQueries({ type: 'inactive' })
    await client.invalidateQueries({ queryKey: sessionQuery.queryKey })
    await navigate({ to: '/' })
  }
  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: ({ value }) => (confirm ? setConfirming(true) : joinNow(value.name)),
  })

  return (
    <Card>
      <InvitationHeader details={details} />
      <CardContent className="grid gap-6">
        {email && (
          <p className="text-sm text-muted-foreground wrap-anywhere">
            {t('invitation.signed-in-as', { email })}
          </p>
        )}
        {confirm ? (
          <Callout tone="warning">{t('invitation.warning')}</Callout>
        ) : (
          <Callout tone="neutral">
            {t('invitation.setup-pending', { workspace: details.workspace })}
          </Callout>
        )}
        {failure && <Callout tone="danger">{t(...failure)}</Callout>}
        <Form form={form} className="grid gap-6">
          {askName && (
            <form.Field name="name" validators={{ onSubmit: invitedNameSchema }}>
              {(field) => (
                <InputField
                  field={field}
                  label={t('invitation.name')}
                  required
                  description={t('invitation.name-hint')}
                  autoComplete="name"
                />
              )}
            </form.Field>
          )}
          <div className="grid gap-2">
            <SubmitButton form={form} disabled={pending}>
              {t('invitation.accept')}
            </SubmitButton>
            <Button variant="ghost" asChild>
              <Link to="/">{t('invitation.actions.not-now')}</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        title={t('invitation.confirm.title', { workspace: details.workspace })}
        description={t('invitation.confirm.body', { workspace: details.workspace })}
        action={t('invitation.confirm.action')}
        pending={pending}
        onClose={() => setConfirming(false)}
        onConfirm={() => void joinNow(form.state.values.name)}
      />
    </Card>
  )
}
