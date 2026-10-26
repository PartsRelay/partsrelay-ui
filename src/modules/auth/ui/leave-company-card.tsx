import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import type { ProfileView } from '@/modules/auth/core/profile'
import { endSession } from '@/modules/auth/core/session.query'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { Callout } from '@/ui/components/callout'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

type LeaveCompanyCardProps = { view: ProfileView; workspace: Workspace }

export function LeaveCompanyCard({ view, workspace }: LeaveCompanyCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const { client, pending, run } = useBetterAuthAction()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('profile.leave.title')}</h2>
        </CardTitle>
        <CardDescription>
          {t('profile.leave.description', { company: view.company })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {view.canLeave ? (
          <Button
            variant="destructive"
            className="justify-self-start"
            onClick={() => setConfirming(true)}
          >
            {t('profile.leave.action')}
          </Button>
        ) : (
          <>
            <Callout title={t('profile.leave.owner.title')}>
              {t('profile.leave.owner.description')}
            </Callout>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/workspace" search={{ transfer: true }}>
                  {t('profile.leave.owner.transfer')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/company">{t('profile.leave.owner.delete')}</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirming}
        title={t('profile.confirm.leave.title', { company: view.company })}
        description={t('profile.confirm.leave.body')}
        action={t('profile.confirm.leave.action')}
        pending={pending}
        onConfirm={() =>
          void run(
            async () => {
              await authClient.organization.leave({ organizationId: workspace.id })
              endSession(client)
              await navigate({ to: '/login' })
            },
            { notice: 'profile.notices.left', values: { company: workspace.name } }
          )
        }
        onClose={() => setConfirming(false)}
      />
    </Card>
  )
}
