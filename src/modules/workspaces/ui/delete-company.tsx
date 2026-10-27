import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { endSession } from '@/modules/auth/core/session.query'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'

export function DeleteCompany({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const { client, pending, run } = useBetterAuthAction()

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('company.delete.title')}</CardHeading>
        <CardDescription>{t('company.delete.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          {t('company.delete.action')}
        </Button>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        title={t('company.confirm.delete.title', { company: workspace.name })}
        description={t('company.confirm.delete.body', { company: workspace.name })}
        action={t('company.confirm.delete.action')}
        pending={pending}
        onConfirm={() =>
          void run(
            async () => {
              await authClient.organization.delete({ organizationId: workspace.id })
              endSession(client)
              await navigate({ to: '/login' })
            },
            { notice: 'company.notices.deleted' }
          )
        }
        onClose={() => setConfirming(false)}
      />
    </Card>
  )
}
