import { Link } from '@tanstack/react-router'
import { MailXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Message } from '@/core/message'
import { CardHeading } from '@/ui/components/card-heading'
import { Callout } from '@/ui/components/callout'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/components/ui/card'

type InvitationUnavailableProps = { reason: Message }

export function InvitationUnavailable({ reason }: InvitationUnavailableProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardHeading level={1}>{t('invitation.unavailable.title')}</CardHeading>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Callout tone="warning" icon={MailXIcon}>
          {t(...reason)}
        </Callout>
        <Button asChild>
          <Link to="/">{t('invitation.actions.open-app')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
