import { createFileRoute } from '@tanstack/react-router'
import { teamSearchSchema } from '@/modules/workspaces/core/team'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { InvitationsTable } from '@/modules/workspaces/ui/invitations-table'
import { InviteCard } from '@/modules/workspaces/ui/invite-card'
import { MembersTable } from '@/modules/workspaces/ui/members-table'
import { TeamHeader } from '@/modules/workspaces/ui/team-header'
import { TransferOwnershipDialog } from '@/modules/workspaces/ui/transfer-ownership-dialog'

export const Route = createFileRoute('/_app/(workspaces)/team')({
  validateSearch: teamSearchSchema,
  staticData: { crumb: 'team' },
  component: TeamPage,
})

function TeamPage() {
  const { me } = useMe()
  const { transfer } = Route.useSearch()
  const navigate = Route.useNavigate()
  const setTransfer = (open: boolean) =>
    void navigate({ search: { transfer: open || undefined }, replace: !open })

  return (
    <>
      <TeamHeader />
      <MembersTable onTransfer={() => setTransfer(true)} />
      <InviteCard />
      <InvitationsTable />
      <TransferOwnershipDialog
        open={transfer === true && me.permissions.transferOwnership}
        onOpenChange={setTransfer}
      />
    </>
  )
}
