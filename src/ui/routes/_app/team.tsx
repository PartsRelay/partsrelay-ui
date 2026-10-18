import { createFileRoute } from '@tanstack/react-router'
import { teamSearchSchema } from '@/modules/core/team/team'
import { useMe } from '@/modules/ui/app/use-me'
import { InvitationsTable } from '@/modules/ui/team/invitations-table'
import { InviteCard } from '@/modules/ui/team/invite-card'
import { MembersTable } from '@/modules/ui/team/members-table'
import { TeamHeader } from '@/modules/ui/team/team-header'
import { TransferOwnershipDialog } from '@/modules/ui/team/transfer-ownership-dialog'

export const Route = createFileRoute('/_app/team')({
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
