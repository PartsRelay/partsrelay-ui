import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { type InvitationRow, withoutInvitation } from '@/modules/workspaces/core/team'
import type { FullOrganization } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

type RevokeInvitationDialogProps = {
  row: InvitationRow
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RevokeInvitationDialog({
  row,
  open,
  onClose,
  returnTo,
}: RevokeInvitationDialogProps) {
  const { t } = useTranslation()
  const { client, pending, run } = useBetterAuthAction()
  const { id } = row.invitation

  return (
    <ConfirmDialog
      open={open}
      title={t('team.confirm.revoke.title', { email: row.invitation.email })}
      description={t('team.confirm.revoke.body')}
      action={t('team.confirm.revoke.action')}
      pending={pending}
      onConfirm={async () => {
        const result = await run(
          () =>
            optimistic<FullOrganization>(
              client,
              workspaceKey,
              (organization) => withoutInvitation(organization, id),
              () => authClient.organization.cancelInvitation({ invitationId: id })
            ),
          { notice: 'team.notices.invitation-revoked' }
        )
        if (result.ok) onClose()
      }}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
