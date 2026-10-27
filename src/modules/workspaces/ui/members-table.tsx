import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type Member, memberRows } from '@/modules/workspaces/core/workspace'
import { RemoveMemberDialog } from '@/modules/workspaces/ui/remove-member-dialog'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PersonItem } from '@/ui/components/person-item'
import { ResponsiveTable } from '@/ui/components/responsive-table'
import { StatusBadge } from '@/ui/components/status-badge'
import { MemberActions } from '@/modules/workspaces/ui/member-actions'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/ui/table'

const columns = ['member', 'role', 'actions']

export function MembersTable({ onTransfer }: { onTransfer: () => void }) {
  const { t } = useTranslation()
  const { workspace, me } = useMe()
  const heading = useRef<HTMLHeadingElement>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardHeading ref={heading} tabIndex={-1} className="outline-none">
          {t('workspace.members.title')}
        </CardHeading>
        <CardDescription>{t('workspace.members.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveTable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{t(`workspace.members.columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberRows(workspace, me).map((row) => (
              <TableRow key={row.member.id}>
                <TableCell>
                  <PersonItem
                    name={row.member.name}
                    description={row.member.email}
                    image={row.member.image}
                    title={
                      row.isMe ? t('workspace.members.you', { name: row.member.name }) : undefined
                    }
                  />
                </TableCell>
                <TableCell data-label={t('workspace.members.columns.role')}>
                  <StatusBadge tone="neutral">{t(...row.roleLabel)}</StatusBadge>
                </TableCell>
                <TableCell>
                  <MemberActions
                    row={row}
                    onTransfer={onTransfer}
                    onRemove={() => {
                      setRemoving(row.member)
                      setConfirming(true)
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ResponsiveTable>
        {removing && (
          <RemoveMemberDialog
            key={removing.id}
            member={removing}
            open={confirming}
            onClose={() => setConfirming(false)}
            returnTo={heading}
          />
        )}
      </CardContent>
    </Card>
  )
}
