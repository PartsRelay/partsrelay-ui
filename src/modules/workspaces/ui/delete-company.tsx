import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { endSession } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { deleteCompanyConfirm } from '@/modules/workspaces/core/company'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useAction } from '@/ui/hooks/use-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function DeleteCompany({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const { client, pending, run } = useAction()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('company.delete.title')}</h2>
        </CardTitle>
        <CardDescription>{t('company.delete.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          {t('company.delete.action')}
        </Button>
      </CardContent>
      <ConfirmDialog
        spec={confirming ? deleteCompanyConfirm(workspace) : null}
        pending={pending}
        onConfirm={() =>
          void run(
            async () => {
              await authClient.organization.delete({ organizationId: workspace.id })
              // The core deletes every account too
              endSession(client)
              await navigate({ to: '/login' })
            },
            { notice: message('company.notices.deleted') }
          )
        }
        onClose={() => setConfirming(false)}
      />
    </Card>
  )
}
