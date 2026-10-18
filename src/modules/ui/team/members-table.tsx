import { useTranslation } from 'react-i18next'
import { memberRows } from '@/modules/core/team/team'
import { useMe } from '@/modules/ui/app/use-me'
import { PersonAvatar } from '@/modules/ui/shared/person-avatar'
import { StatusBadge } from '@/modules/ui/shared/status-badge'
import { useT } from '@/modules/ui/shared/use-t'
import { MemberActions } from '@/modules/ui/team/member-actions'
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
  const translate = useT()
  const { workspace, me } = useMe()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('team.members.title')}</h2>
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
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={row.member.name} image={row.member.image} />
                    <div className="grid">
                      <span className="font-medium">
                        {row.isMe
                          ? t('team.members.you', { name: row.member.name })
                          : row.member.name}
                      </span>
                      <span className="text-muted-foreground">{row.member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone="neutral">{translate(row.roleLabel)}</StatusBadge>
                </TableCell>
                <TableCell>
                  <MemberActions row={row} onTransfer={onTransfer} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
