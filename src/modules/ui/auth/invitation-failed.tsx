import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { CloudAlertIcon, RotateCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { failedQueries } from '@/modules/core/auth/invitation.query'
import type { Message } from '@/modules/core/shared/message'
import { AuthTitle } from '@/modules/ui/auth/auth-title'
import { Callout } from '@/modules/ui/shared/callout'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/components/ui/card'
import { Spinner } from '@/ui/components/ui/spinner'

export function InvitationFailed({ reason }: { reason: Message }) {
  const { t } = useTranslation()
  const translate = useT()
  const client = useQueryClient()
  const retrying = useIsFetching(failedQueries) > 0

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('invitation.failed.title')}</AuthTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Callout tone="danger" icon={CloudAlertIcon}>
          {translate(reason)}
        </Callout>
        <Button disabled={retrying} onClick={() => void client.refetchQueries(failedQueries)}>
          {retrying ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RotateCwIcon data-icon="inline-start" />
          )}
          {t('invitation.actions.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}
