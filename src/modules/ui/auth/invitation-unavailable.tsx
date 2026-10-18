import { Link } from '@tanstack/react-router'
import { MailXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Message } from '@/modules/core/shared/message'
import { AuthTitle } from '@/modules/ui/auth/auth-title'
import { Callout } from '@/modules/ui/shared/callout'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/components/ui/card'

type InvitationUnavailableProps = { reason: Message }

export function InvitationUnavailable({ reason }: InvitationUnavailableProps) {
  const { t } = useTranslation()
  const translate = useT()

  return (
    <Card>
      <CardHeader>
        <AuthTitle>{t('invitation.unavailable.title')}</AuthTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Callout tone="warning" icon={MailXIcon}>
          {translate(reason)}
        </Callout>
        <Button asChild>
          <Link to="/">{t('invitation.actions.openApp')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
