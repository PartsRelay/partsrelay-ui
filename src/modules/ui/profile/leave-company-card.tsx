import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { leaveCompanyConfirm, type ProfileView } from '@/modules/core/profile/profile'
import { leaveCompanyMutation } from '@/modules/core/profile/profile.mutation'
import type { Workspace } from '@/modules/core/workspace/workspace'
import { Callout } from '@/modules/ui/shared/callout'
import { ConfirmDialog } from '@/modules/ui/shared/confirm-dialog'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

type LeaveCompanyCardProps = { view: ProfileView; workspace: Workspace }

export function LeaveCompanyCard({ view, workspace }: LeaveCompanyCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const leave = useMutation(leaveCompanyMutation(workspace))

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
                <Link to="/team" search={{ transfer: true }}>
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
        spec={confirming ? leaveCompanyConfirm(view) : null}
        pending={leave.isPending}
        onConfirm={() =>
          leave.mutate(undefined, { onSuccess: () => void navigate({ to: '/login' }) })
        }
        onClose={() => setConfirming(false)}
      />
    </Card>
  )
}
