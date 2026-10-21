import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import {
  type FullOrganization,
  type Member,
  withoutMember,
} from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'

type RemoveMemberDialogProps = {
  member: Member
  open: boolean
  onClose: () => void
  returnTo: RefObject<HTMLElement | null>
}

export function RemoveMemberDialog({ member, open, onClose, returnTo }: RemoveMemberDialogProps) {
  const { t } = useTranslation()
  const { workspace } = useMe()
  const { client, pending, run } = useBetterAuthAction()

  return (
    <ConfirmDialog
      open={open}
      title={t('team.confirm.remove.title', { name: member.name })}
      description={t('team.confirm.remove.body', { name: member.name, company: workspace.name })}
      action={t('team.confirm.remove.action')}
      pending={pending}
      onConfirm={async () => {
        const result = await run(
          () =>
            optimistic<FullOrganization>(
              client,
              workspaceKey,
              (organization) => withoutMember(organization, member.id),
              () => authClient.organization.removeMember({ memberIdOrEmail: member.id })
            ),
          { notice: 'team.notices.member-removed', values: { name: member.name } }
        )
        if (result.ok) onClose()
      }}
      onClose={onClose}
      returnTo={returnTo}
    />
  )
}
