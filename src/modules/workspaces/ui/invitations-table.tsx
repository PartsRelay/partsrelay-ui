import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { type InvitationRow, invitationRows } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { RevokeInvitationDialog } from '@/modules/workspaces/ui/revoke-invitation-dialog'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { CopyButton } from '@/ui/components/copy-button'
import { ResponsiveTable } from '@/ui/components/responsive-table'
import { StatusBadge } from '@/ui/components/status-badge'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { ActionButton } from '@/modules/workspaces/ui/action-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/components/ui/empty'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/ui/table'

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
            {t('workspace.invitations.title')}
          </h2>
        </CardTitle>
        <CardDescription>{t('workspace.invitations.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>{t('workspace.invitations.empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{t(`workspace.invitations.columns.${column}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.invitation.id}>
                  <TableCell className="font-medium">{row.invitation.email}</TableCell>
                  <TableCell data-label={t('workspace.invitations.columns.role')}>
                    {t(...row.roleLabel)}
                  </TableCell>
                  <TableCell data-label={t('workspace.invitations.columns.sent')}>
                    <span className="inline-flex items-center gap-2">
                      {row.sent}
                      {row.expired && (
                        <StatusBadge tone="danger">
                          {t('workspace.invitations.expired')}
                        </StatusBadge>
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
          </ResponsiveTable>
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
    return <span className="text-muted-foreground">{t('workspace.invitations.owner-only')}</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {!row.expired && (
        <CopyButton
          variant="link"
          className="h-auto p-0"
          text={row.link}
          notice="workspace.notices.link-copied"
          aria-label={t('workspace.actions.copy-link-for', { email })}
        >
          {t('workspace.actions.copy-link')}
        </CopyButton>
      )}
      <ActionButton
        aria-label={t('workspace.actions.resend-to', { email })}
        aria-disabled={pending}
        onClick={() => {
          if (pending) return

          void run(
            async () => {
              try {
                await authClient.organization.inviteMember({ email, role, resend: true })
              } finally {
                await client.invalidateQueries({ queryKey: workspaceKey })
              }
            },
            { notice: 'workspace.notices.invitation-resent', values: { email } }
          )
        }}
      >
        {t('workspace.actions.resend')}
      </ActionButton>
      <ActionButton aria-label={t('workspace.actions.revoke-for', { email })} onClick={onRevoke}>
        {t('workspace.actions.revoke')}
      </ActionButton>
    </div>
  )
}
