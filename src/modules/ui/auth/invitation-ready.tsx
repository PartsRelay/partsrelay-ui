import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { acceptError, type InvitationDetails, joinConfirm } from '@/modules/core/auth/invitation'
import { InvitationHeader } from '@/modules/ui/auth/invitation-header'
import { Callout } from '@/modules/ui/shared/callout'
import { ConfirmDialog } from '@/modules/ui/shared/confirm-dialog'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent } from '@/ui/components/ui/card'

type InvitationReadyProps = {
  details: InvitationDetails
  email: string | null
  accept: UseMutationOptions<unknown, Error, void>
}

export function InvitationReady({ details, email, accept }: InvitationReadyProps) {
  const { t } = useTranslation()
  const translate = useT()
  const navigate = useNavigate()
  const join = useMutation(accept)
  const [confirming, setConfirming] = useState(false)
  const failure = join.error && acceptError(join.error)

  return (
    <Card>
      <InvitationHeader details={details} />
      <CardContent className="grid gap-6">
        {email && (
          <p className="text-sm text-muted-foreground wrap-anywhere">
            {t('invitation.signedInAs', { email })}
          </p>
        )}
        <Callout tone="warning">{t('invitation.warning')}</Callout>
        {failure && <Callout tone="danger">{translate(failure)}</Callout>}
        <div className="grid gap-2">
          <Button onClick={() => setConfirming(true)}>{t('invitation.accept')}</Button>
          <Button variant="ghost" asChild>
            <Link to="/">{t('invitation.actions.notNow')}</Link>
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        spec={confirming ? joinConfirm(details.workspace) : null}
        pending={join.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          join.mutate(undefined, {
            onSuccess: () => navigate({ to: '/' }),
            onError: () => setConfirming(false),
          })
        }
      />
    </Card>
  )
}
