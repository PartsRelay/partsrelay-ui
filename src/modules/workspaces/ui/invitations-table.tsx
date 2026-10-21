import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { localeHeaders } from '@/i18n'
import { authClient } from '@/modules/auth/core/auth.client'
import { type InvitationRow, invitationRows } from '@/modules/workspaces/core/team'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { RevokeInvitationDialog } from '@/modules/workspaces/ui/revoke-invitation-dialog'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { CopyButton } from '@/ui/components/copy-button'
import { StatusBadge } from '@/ui/components/status-badge'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { ActionButton } from '@/modules/workspaces/ui/action-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/ui/table'

const columns = ['invitation', 'role', 'sent', 'actions']

export function InvitationsTable() {
  const { t, i18n } = useTranslation()
  const { workspace, me } = useMe()
  const rows = invitationRows(workspace, me, new Date(), window.location.origin, i18n.language)
  const heading = useRef<HTMLHeadingElement>(null)
  // Outlives the row, which leaves before the core answers
  const [revoking, setRevoking] = useState<InvitationRow | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 ref={heading} tabIndex={-1} className="outline-none">
            {t('team.invitations.title')}
          </h2>
        </CardTitle>
        <CardDescription>{t('team.invitations.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>{t('team.invitations.empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{t(`team.invitations.columns.${column}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.invitation.id}>
                  <TableCell className="font-medium">{row.invitation.email}</TableCell>
                  <TableCell>{t(...row.roleLabel)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {row.sent}
                      {row.expired && (
                        <StatusBadge tone="danger">{t('team.invitations.expired')}</StatusBadge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InvitationActions
                      row={row}
                      onRevoke={() => {
                        setRevoking(row)
                        setConfirming(true)
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {revoking && (
          <RevokeInvitationDialog
            key={revoking.invitation.id}
            row={revoking}
            open={confirming}
            onClose={() => setConfirming(false)}
            returnTo={heading}
          />
        )}
      </CardContent>
    </Card>
  )
}

function InvitationActions({ row, onRevoke }: { row: InvitationRow; onRevoke: () => void }) {
  const { t } = useTranslation()
  const { client, pending, run } = useBetterAuthAction()
  const { email, role } = row.invitation

  if (!row.canManage) {
    return <span className="text-muted-foreground">{t('team.invitations.owner-only')}</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {!row.expired && (
        <CopyButton
          variant="link"
          className="h-auto p-0"
          text={row.link}
          notice="team.notices.link-copied"
          aria-label={t('team.actions.copy-link-for', { email })}
        >
          {t('team.actions.copy-link')}
        </CopyButton>
      )}
      <ActionButton
        aria-label={t('team.actions.resend-to', { email })}
        disabled={pending}
        onClick={() =>
          void run(
            async () => {
              try {
                await authClient.organization.inviteMember({
                  email,
                  role,
                  resend: true,
                  fetchOptions: { headers: localeHeaders() },
                })
              } finally {
                await client.invalidateQueries({ queryKey: workspaceKey })
              }
            },
            { notice: 'team.notices.invitation-resent', values: { email } }
          )
        }
      >
        {t('team.actions.resend')}
      </ActionButton>
      <ActionButton aria-label={t('team.actions.revoke-for', { email })} onClick={onRevoke}>
        {t('team.actions.revoke')}
      </ActionButton>
    </div>
  )
}
