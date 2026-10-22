import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import type { ProfileView } from '@/modules/auth/core/profile'
import { endSession } from '@/modules/auth/core/session.query'
import type { Workspace } from '@/modules/workspaces/core/workspace'
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
    <Card className="workspace-card profile-danger">
      <CardHeader>
        <span className="personal-account-label">{t('profile.leave.eyebrow')}</span>
        <CardTitle>
          <h2>{t('profile.leave.title')}</h2>
        </CardTitle>
        <CardDescription>
          {t('profile.leave.description', { company: view.company })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!view.canLeave && (
          <div className="profile-owner-notice">
            <img src="/images/owner-warning.svg" alt="" width="20" height="20" />
            <div>
              <strong>{t('profile.leave.owner.title')}</strong>
              <p>{t('profile.leave.owner.description')}</p>
            </div>
          </div>
        )}
        <Button
          variant="destructive"
          disabled={!view.canLeave || pending}
          onClick={() => setConfirming(true)}
        >
          {t('profile.leave.action')}
        </Button>
        {!view.canLeave && (
          <div className="profile-owner-links">
            <Button variant="link" asChild>
              <Link to="/workspace" search={{ transfer: true }}>
                {t('profile.leave.owner.transfer')}
              </Link>
            </Button>
            <Button variant="link" asChild>
              <Link to="/company">{t('profile.leave.owner.delete')}</Link>
            </Button>
          </div>
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
              // The core deletes the account, so this ends the session
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
