import { Link } from '@tanstack/react-router'
import { MailXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Message } from '@/core/message'
import { AuthTitle } from '@/modules/auth/ui/auth-title'
import { Callout } from '@/ui/components/callout'
import { useT } from '@/ui/hooks/use-t'
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
