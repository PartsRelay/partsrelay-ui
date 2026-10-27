import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { LookupRow } from '@/modules/lookups/core/lookup-row'
import { DataTable } from '@/ui/components/data-table'
import { StatusBadge } from '@/ui/components/status-badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/ui/components/ui/item'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/ui/table'

const columns = ['plate', 'parts', 'status', 'channel', 'requester', 'requested']

const resultOf = ({ lookup }: LookupRow) =>
  ({ to: '/lookups/$lookupId', params: { lookupId: String(lookup.id) } }) as const

function Parts({ row }: { row: LookupRow }) {
  if (!row.part && !row.vehicle) return <span aria-hidden>-</span>

  return (
    <div className="grid gap-0.5 whitespace-normal">
      {row.part && <span className="font-medium">{row.part}</span>}
      {row.vehicle && <span className="text-muted-foreground">{row.vehicle}</span>}
    </div>
  )
}

export function LookupsTable({ rows }: { rows: LookupRow[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      <div className="hidden md:block">
        <DataTable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{t(`lookups.columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.lookup.id}
                className="cursor-pointer"
                onClick={() => void navigate(resultOf(row))}
              >
                <TableCell>
                  <Link
                    {...resultOf(row)}
                    aria-label={t('lookups.list.open', { plate: row.identifier })}
                    className="font-heading font-bold tracking-wide underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.identifier}
                  </Link>
                  {row.lookup.plate && row.lookup.vin && (
                    <p className="text-xs tracking-wide text-muted-foreground">{row.lookup.vin}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Parts row={row} />
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.tone}>{t(...row.statusLabel)}</StatusBadge>
                </TableCell>
                <TableCell>{t(...row.sourceLabel)}</TableCell>
                <TableCell>{t(...row.searcher)}</TableCell>
                <TableCell>{row.requested}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>
      <ul className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row.lookup.id}>
            <Item variant="outline" asChild>
              <Link {...resultOf(row)}>
                <ItemContent className="min-w-0">
                  <ItemTitle className="font-heading font-bold tracking-wide">
                    {row.identifier}
                  </ItemTitle>
                  <div className="text-sm">
                    <Parts row={row} />
                  </div>
                  <ItemDescription className="line-clamp-none text-xs">
                    {[t(...row.searcher), t(...row.sourceLabel), row.requested].join(' · ')}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="self-start">
                  <StatusBadge tone={row.tone}>{t(...row.statusLabel)}</StatusBadge>
                </ItemActions>
              </Link>
            </Item>
          </li>
        ))}
      </ul>
    </>
  )
}
