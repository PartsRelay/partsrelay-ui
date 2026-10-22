import { getRouteApi } from '@tanstack/react-router'
import { InvitationsTable } from '@/modules/workspaces/ui/invitations-table'
import { InviteCard } from '@/modules/workspaces/ui/invite-card'
import { MembersTable } from '@/modules/workspaces/ui/members-table'
import { WorkspaceHeader } from '@/modules/workspaces/ui/workspace-header'
import { TransferOwnershipDialog } from '@/modules/workspaces/ui/transfer-ownership-dialog'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { useTranslation } from 'react-i18next'
import '@/modules/workspaces/ui/workspace-pages.css'

const route = getRouteApi('/_app/(workspaces)/workspace')

export function WorkspacePage() {
  const { t } = useTranslation()
  const { me } = useMe()
  const { transfer } = route.useSearch()
  const navigate = route.useNavigate()
  const setTransfer = (open: boolean) =>
    void navigate({ search: { transfer: open || undefined }, replace: !open })

  return (
    <div className="workspace-page page-stack">
      <WorkspaceHeader />
      <MembersTable onTransfer={() => setTransfer(true)} />
      <div className="team-invitations-grid">
        <InvitationsTable />
        {me.permissions.inviteRoles.length > 0 && <InviteCard key={me.role} />}
      </div>
      <aside className="workspace-info">
        <img src="/images/workspace-info.svg" alt="" width="20" height="20" />
        <div>
          <strong>{t('team.safeguards.title')}</strong>
          <p>{t('team.safeguards.description')}</p>
        </div>
      </aside>
      <TransferOwnershipDialog
        open={transfer === true && me.permissions.transferOwnership}
        onOpenChange={setTransfer}
      />
    </div>
  )
}
