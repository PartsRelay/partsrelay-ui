import { getRouteApi } from '@tanstack/react-router'
import { InvitationsTable } from '@/modules/workspaces/ui/invitations-table'
import { InviteCard } from '@/modules/workspaces/ui/invite-card'
import { MembersTable } from '@/modules/workspaces/ui/members-table'
import { TeamHeader } from '@/modules/workspaces/ui/team-header'
import { TransferOwnershipDialog } from '@/modules/workspaces/ui/transfer-ownership-dialog'
import { useMe } from '@/modules/workspaces/ui/use-me'

const route = getRouteApi('/_app/(workspaces)/team')

export function TeamPage() {
  const { me } = useMe()
  const { transfer } = route.useSearch()
  const navigate = route.useNavigate()
  const setTransfer = (open: boolean) =>
    void navigate({ search: { transfer: open || undefined }, replace: !open })

  return (
    <>
      <TeamHeader />
      <MembersTable onTransfer={() => setTransfer(true)} />
      {/* A new form when an ownership hand-over changes my roles */}
      <InviteCard key={me.role} />
      <InvitationsTable />
      <TransferOwnershipDialog
        open={transfer === true && me.permissions.transferOwnership}
        onOpenChange={setTransfer}
      />
    </>
  )
}
