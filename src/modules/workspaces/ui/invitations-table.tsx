import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { message } from '@/core/message'
import { type InvitationRow, invitationRows, revokeConfirm } from '@/modules/workspaces/core/team'
import {
  cancelInvitationMutation,
  resendInvitationMutation,
} from '@/modules/workspaces/core/team.mutation'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { CopyButton } from '@/ui/components/copy-button'
import { StatusBadge } from '@/ui/components/status-badge'
import { useT } from '@/ui/components/use-t'
import { ActionButton } from '@/modules/workspaces/ui/action-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card'
import { Empty, EmptyHeader, EmptyTitle } from '@/ui/components/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/table'

const columns = ['invitation', 'role', 'sent', 'actions']

export function InvitationsTable() {
  const { t, i18n } = useTranslation()
  const translate = useT()
  const { workspace, me } = useMe()
  const rows = invitationRows(workspace, me, new Date(), window.location.origin, i18n.language)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('team.invitations.title')}</h2>
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
                  <TableCell>{translate(row.roleLabel)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      {row.sent}
                      {row.expired && (
                        <StatusBadge tone="danger">{t('team.invitations.expired')}</StatusBadge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InvitationActions row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function InvitationActions({ row }: { row: InvitationRow }) {
  const { t } = useTranslation()
  const [revoking, setRevoking] = useState(false)
  const resend = useMutation(resendInvitationMutation(row.invitation))
  const revoke = useMutation(cancelInvitationMutation(row.invitation))
  const { email } = row.invitation

  if (!row.canManage) {
    return <span className="text-muted-foreground">{t('team.invitations.ownerOnly')}</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {!row.expired && (
        <CopyButton
          variant="link"
          className="h-auto p-0"
          text={row.link}
          notice={message('team.notices.linkCopied')}
          aria-label={t('team.actions.copyLinkFor', { email })}
        >
          {t('team.actions.copyLink')}
        </CopyButton>
      )}
      <ActionButton
        aria-label={t('team.actions.resendTo', { email })}
        disabled={resend.isPending}
        onClick={() => resend.mutate()}
      >
        {t('team.actions.resend')}
      </ActionButton>
      <ActionButton
        aria-label={t('team.actions.revokeFor', { email })}
        onClick={() => setRevoking(true)}
      >
        {t('team.actions.revoke')}
      </ActionButton>
      <ConfirmDialog
        spec={revoking ? revokeConfirm(row) : null}
        pending={revoke.isPending}
        onConfirm={() => revoke.mutate(undefined, { onSuccess: () => setRevoking(false) })}
        onClose={() => setRevoking(false)}
      />
    </div>
  )
}
