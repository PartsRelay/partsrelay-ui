import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deleteCompanyConfirm } from '@/modules/workspaces/core/company'
import { deleteCompanyMutation } from '@/modules/workspaces/core/company.mutation'
import type { Workspace } from '@/modules/workspaces/core/workspace'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'

export function DeleteCompany({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const remove = useMutation(deleteCompanyMutation(workspace))

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
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, { onSuccess: () => void navigate({ to: '/login' }) })
        }
        onClose={() => setConfirming(false)}
      />
    </Card>
  )
}
