import type { ContactRow } from '@/modules/core/contacts/contacts'
import { StatusBadge } from '@/modules/ui/shared/status-badge'
import { useT } from '@/modules/ui/shared/use-t'

export function ContactStatus({ row }: { row: ContactRow }) {
  const translate = useT()

  return <StatusBadge tone={row.tone}>{translate(row.statusLabel)}</StatusBadge>
}
