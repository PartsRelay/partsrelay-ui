import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { CloudAlertIcon, RotateCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { failedQueries } from '@/modules/auth/core/invitation.query'
import type { Message } from '@/core/message'
import { CardHeading } from '@/ui/components/card-heading'
import { Callout } from '@/ui/components/callout'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/components/ui/card'
import { Spinner } from '@/ui/components/ui/spinner'

export function InvitationFailed({ reason }: { reason: Message }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const retrying = useIsFetching(failedQueries) > 0

  return (
    <Card>
      <CardHeader>
        <CardHeading level={1}>{t('invitation.failed.title')}</CardHeading>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Callout tone="danger" icon={CloudAlertIcon}>
          {t(...reason)}
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
