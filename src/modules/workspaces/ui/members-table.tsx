import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { memberRows } from '@/modules/workspaces/core/team'
import type { Member } from '@/modules/workspaces/core/workspace'
import { RemoveMemberDialog } from '@/modules/workspaces/ui/remove-member-dialog'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { PersonItem } from '@/ui/components/person-item'
import { StatusBadge } from '@/ui/components/status-badge'
import { MemberActions } from '@/modules/workspaces/ui/member-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/ui/table'

const columns = ['member', 'role', 'actions']

export function MembersTable({ onTransfer }: { onTransfer: () => void }) {
  const { t } = useTranslation()
  const { workspace, me } = useMe()
  const heading = useRef<HTMLHeadingElement>(null)
  // Outlives the row, which leaves before the core answers
  const [removing, setRemoving] = useState<Member | null>(null)
  const [confirming, setConfirming] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 ref={heading} tabIndex={-1} className="outline-none">
            {t('team.members.title')}
          </h2>
        </CardTitle>
        <CardDescription>{t('team.members.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{t(`team.members.columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberRows(workspace, me).map((row) => (
              <TableRow key={row.member.id}>
                <TableCell>
                  <PersonItem
                    name={row.member.name}
                    email={row.member.email}
                    image={row.member.image}
                    title={row.isMe ? t('team.members.you', { name: row.member.name }) : undefined}
                  />
                </TableCell>
                <TableCell>
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
        </Table>
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
