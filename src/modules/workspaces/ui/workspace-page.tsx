import { getRouteApi } from '@tanstack/react-router'
import { InvitationsTable } from '@/modules/workspaces/ui/invitations-table'
import { InviteCard } from '@/modules/workspaces/ui/invite-card'
import { MembersTable } from '@/modules/workspaces/ui/members-table'
import { WorkspaceHeader } from '@/modules/workspaces/ui/workspace-header'
import { TransferOwnershipDialog } from '@/modules/workspaces/ui/transfer-ownership-dialog'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

const route = getRouteApi('/_app/(workspaces)/workspace')

export function WorkspacePage() {
  const { me } = useMe()
  const { transfer } = route.useSearch()
  const navigate = route.useNavigate()
  const setTransfer = (open: boolean) =>
    void navigate({ search: { transfer: open || undefined }, replace: !open })

  return (
    <>
      <WorkspaceHeader />
      <MembersTable onTransfer={() => setTransfer(true)} />
      <InviteCard key={me.role} />
      <InvitationsTable />
      <TransferOwnershipDialog
        open={transfer === true && me.permissions.transferOwnership}
        onOpenChange={setTransfer}
      />
    </>
  )
}
