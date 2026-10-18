import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { acceptError, type InvitationDetails, joinConfirm } from '@/modules/auth/core/invitation'
import { InvitationHeader } from '@/modules/auth/ui/invitation-header'
import { Callout } from '@/ui/components/callout'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useT } from '@/ui/components/use-t'
import { Button } from '@/ui/components/button'
import { Card, CardContent } from '@/ui/components/card'
import { Spinner } from '@/ui/components/spinner'

type InvitationReadyProps = {
  details: InvitationDetails
  confirm: boolean
  email: string | null
  accept: UseMutationOptions<unknown, Error, void>
}

export function InvitationReady({ details, confirm, email, accept }: InvitationReadyProps) {
  const { t } = useTranslation()
  const translate = useT()
  const navigate = useNavigate()
  const join = useMutation(accept)
  const [confirming, setConfirming] = useState(false)
  const failure = join.error && acceptError(join.error)
  const joinNow = () =>
    join.mutate(undefined, {
      onSuccess: () => navigate({ to: '/' }),
      onError: () => setConfirming(false),
    })

  return (
    <Card>
      <InvitationHeader details={details} />
      <CardContent className="grid gap-6">
        {email && (
          <p className="text-sm text-muted-foreground wrap-anywhere">
            {t('invitation.signedInAs', { email })}
          </p>
        )}
        {confirm ? (
          <Callout tone="warning">{t('invitation.warning')}</Callout>
        ) : (
          <Callout tone="neutral">
            {t('invitation.setupPending', { workspace: details.workspace })}
          </Callout>
        )}
        {failure && <Callout tone="danger">{translate(failure)}</Callout>}
        <div className="grid gap-2">
          <Button
            disabled={join.isPending}
            onClick={() => (confirm ? setConfirming(true) : joinNow())}
          >
            {join.isPending && !confirm && <Spinner data-icon="inline-start" />}
            {t('invitation.accept')}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">{t('invitation.actions.notNow')}</Link>
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        spec={confirming ? joinConfirm(details.workspace) : null}
        pending={join.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={joinNow}
      />
    </Card>
  )
}
