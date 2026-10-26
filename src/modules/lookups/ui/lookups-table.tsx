import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { LookupRow } from '@/modules/lookups/core/lookup-row'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { StatusBadge } from '@/ui/components/status-badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/ui/components/ui/item'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/ui/table'

const columns = ['plate', 'parts', 'status', 'channel', 'requester', 'requested']

const resultOf = ({ lookup }: LookupRow) =>
  ({ to: '/searches/$lookupId', params: { lookupId: String(lookup.id) } }) as const

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
  const text = useText()
  const navigate = useNavigate()

  return (
    <>
      <div className="hidden md:block">
        <Table>
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
                    className="font-mono font-medium underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.identifier}
                  </Link>
                  {row.lookup.plate && row.lookup.vin && (
                    <p className="font-mono text-xs text-muted-foreground">{row.lookup.vin}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Parts row={row} />
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.tone}>{t(...row.statusLabel)}</StatusBadge>
                </TableCell>
                <TableCell>{t(...row.sourceLabel)}</TableCell>
                <TableCell>{text(row.searcher)}</TableCell>
                <TableCell>{row.requested}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row.lookup.id}>
            <Item variant="outline" asChild>
              <Link {...resultOf(row)}>
                <ItemContent className="min-w-0">
                  <ItemTitle className="font-mono">{row.identifier}</ItemTitle>
                  <div className="text-sm">
                    <Parts row={row} />
                  </div>
                  <ItemDescription className="line-clamp-none text-xs">
                    {[text(row.searcher), t(...row.sourceLabel), row.requested].join(' · ')}
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
