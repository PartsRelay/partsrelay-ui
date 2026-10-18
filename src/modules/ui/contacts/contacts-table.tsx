import { useSelector } from '@tanstack/react-store'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContactRow } from '@/modules/core/contacts/contacts'
import { createContactRename } from '@/modules/core/contacts/rename'
import { EMPTY_VALUE } from '@/modules/core/shared/format'
import { useMe } from '@/modules/ui/app/use-me'
import { ContactActions } from '@/modules/ui/contacts/contact-actions'
import { ContactStatus } from '@/modules/ui/contacts/contact-status'
import { RenameField } from '@/modules/ui/contacts/rename-field'
import { useT } from '@/modules/ui/shared/use-t'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/ui/table'

const columns = ['contact', 'phone', 'status', 'searches', 'month', 'lastSearch']

export function ContactsTable({ rows }: { rows: ContactRow[] }) {
  const { t } = useTranslation()
  const translate = useT()
  const { me } = useMe()
  const [rename] = useState(createContactRename)
  const renaming = useSelector(rename, (state) => state.id)
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
        {rows.map((row) => (
          <TableRow key={row.contact.id}>
            <TableCell>
              {renaming === row.contact.id ? (
                <RenameField row={row} rename={rename} />
              ) : (
                <div className="grid">
                  <span className="font-medium">{row.name}</span>
                  {row.whatsappName && (
                    <span className="text-muted-foreground">
                      {t('contacts.whatsappName', { name: row.whatsappName })}
                    </span>
                  )}
                </div>
              )}
            </TableCell>
            <TableCell>{row.phone}</TableCell>
            <TableCell>
              <ContactStatus row={row} />
            </TableCell>
            <TableCell>{row.searches.total}</TableCell>
            <TableCell>{row.searches.month}</TableCell>
            <TableCell>{row.lastSearch ? translate(row.lastSearch) : EMPTY_VALUE}</TableCell>
            {manage && (
              <TableCell>
                {renaming !== row.contact.id && (
                  <ContactActions row={row} onRename={() => rename.actions.start(row.contact)} />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
