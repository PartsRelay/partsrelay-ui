import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/contacts/core/contact-row'
import { ContactActions } from '@/modules/contacts/ui/contact-actions'
import { ContactNameForm } from '@/modules/contacts/ui/contact-name-form'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PersonItem } from '@/ui/components/person-item'
import { StatusBadge } from '@/ui/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/ui/table'

const columns = ['contact', 'phone', 'status', 'searches', 'month', 'last-search']

type SearchesLinkProps = { row: ContactRow; period: 'total' | 'month' }

function SearchesLink({ row, period }: SearchesLinkProps) {
  const { t } = useTranslation()
  const count = row.searches[period]
  if (count === 0) return count

  return (
    <Link
      to="/searches"
      search={{ searcherType: 'contact', searcherId: row.contact.id }}
      aria-label={t(`contacts.searches-link.${period}`, { count, name: row.name })}
      className="underline underline-offset-4"
    >
      {count}
    </Link>
  )
}

type ContactsTableProps = {
  rows: ContactRow[]
  onBlock: (row: ContactRow) => void
  onRemove: (row: ContactRow) => void
}

export function ContactsTable({ rows, onBlock, onRemove }: ContactsTableProps) {
  const { t } = useTranslation()
  const { me } = useMe()
  const [renaming, setRenaming] = useState<number | null>(null)
  const manage = me.permissions.manageContacts

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[...columns, ...(manage ? ['actions'] : [])].map((column) => (
            <TableHead key={column}>{t(`contacts.columns.${column}`)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const editing = renaming === row.contact.id

          return (
            <TableRow key={row.contact.id}>
              <TableCell>
                {editing ? (
                  <ContactNameForm row={row} onDone={() => setRenaming(null)} />
                ) : row.whatsappName ? (
                  <PersonItem
                    name={row.name}
                    description={t('contacts.whatsapp-name', { name: row.whatsappName })}
                  />
                ) : (
                  <PersonItem name={row.name} />
                )}
              </TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell>
                <StatusBadge tone={row.tone}>{t(...row.statusLabel)}</StatusBadge>
              </TableCell>
              <TableCell>
                <SearchesLink row={row} period="total" />
              </TableCell>
              <TableCell>
                <SearchesLink row={row} period="month" />
              </TableCell>
              <TableCell>{row.lastSearch ?? t('contacts.never')}</TableCell>
              {manage && (
                <TableCell>
                  {!editing && (
                    <ContactActions
                      row={row}
                      onRename={() => setRenaming(row.contact.id)}
                      onBlock={() => onBlock(row)}
                      onRemove={() => onRemove(row)}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
