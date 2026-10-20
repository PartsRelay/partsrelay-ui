import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { acceptError, type InvitationDetails } from '@/modules/auth/core/invitation'
import { currentCompanyKey } from '@/modules/auth/core/invitation.query'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import { Callout } from '@/ui/components/callout'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useAction } from '@/ui/hooks/use-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent } from '@/ui/components/ui/card'
import { Spinner } from '@/ui/components/ui/spinner'

type InvitationReadyProps = {
  details: InvitationDetails
  confirm: boolean
  email: string | null
  invitationId: string
}

export function InvitationReady({ details, confirm, email, invitationId }: InvitationReadyProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { client, pending, error, run } = useAction()
  const [confirming, setConfirming] = useState(false)
  const failure = error ? acceptError(error) : null
  // Errors show on the card, not as a toast
  const joinNow = async () => {
    const result = await run(() => authClient.organization.acceptInvitation({ invitationId }), {
      notice: 'invitation.notices.joined',
      values: { workspace: details.workspace },
      silent: true,
    })
    if (!result.ok) {
      setConfirming(false)
      return client.invalidateQueries({ queryKey: currentCompanyKey })
    }

    client.removeQueries({ type: 'inactive' })
    await navigate({ to: '/' })
  }

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
        <div className="grid gap-2">
          <Button
            disabled={pending}
            onClick={() => (confirm ? setConfirming(true) : void joinNow())}
          >
            {pending && !confirm && <Spinner data-icon="inline-start" />}
            {t('invitation.accept')}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">{t('invitation.actions.not-now')}</Link>
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        title={t('invitation.confirm.title', { workspace: details.workspace })}
        description={t('invitation.confirm.body', { workspace: details.workspace })}
        action={t('invitation.confirm.action')}
        pending={pending}
        onClose={() => setConfirming(false)}
        onConfirm={() => void joinNow()}
      />
    </Card>
  )
}
