import { useRef, useState } from 'react'
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

type ContactsTableProps = {
  rows: ContactRow[]
  onBlock: (row: ContactRow) => void
  onRemove: (row: ContactRow) => void
}

export function ContactsTable({ rows, onBlock, onRemove }: ContactsTableProps) {
  const { t } = useTranslation()
  const { me } = useMe()
  const [renaming, setRenaming] = useState<number | null>(null)
  const renamed = useRef<number | null>(null)
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
                  <ContactNameForm
                    row={row}
                    onDone={() => {
                      renamed.current = row.contact.id
                      setRenaming(null)
                    }}
                  />
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
              <TableCell>{row.searches.total}</TableCell>
              <TableCell>{row.searches.month}</TableCell>
              <TableCell>{row.lastSearch ?? t('contacts.never')}</TableCell>
              {manage && (
                <TableCell>
                  {!editing && (
                    <ContactActions
                      row={row}
                      renameRef={(button) => {
                        if (button && renamed.current === row.contact.id) {
                          renamed.current = null
                          button.focus()
                        }
                      }}
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
