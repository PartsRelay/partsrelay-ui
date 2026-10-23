import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { alreadyGone } from '@/core/errors'
import { optimistic } from '@/core/optimistic'
import {
  type FullOrganization,
  type InvitationRow,
  withoutInvitation,
} from '@/modules/workspaces/core/workspace'
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
      title={t('workspace.confirm.revoke.title', { email: row.invitation.email })}
      description={t('workspace.confirm.revoke.body')}
      action={t('workspace.confirm.revoke.action')}
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
          { notice: 'workspace.notices.invitation-revoked' }
        )
        if (result.ok || alreadyGone(result.error)) onClose()
      }}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
