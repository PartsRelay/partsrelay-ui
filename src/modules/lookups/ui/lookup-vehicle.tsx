import { useTranslation } from 'react-i18next'
import type { LookupDetail } from '@/modules/lookups/core/lookup-detail'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { Facts } from '@/ui/components/facts'
import { StatusBadge } from '@/ui/components/status-badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/ui/card'

export function LookupVehicle({ detail }: { detail: LookupDetail }) {
  const { t } = useTranslation()
  const text = useText()
  const identifying = detail.vin !== null || detail.state === 'running'
  const vehicle = detail.vehicle ?? (identifying ? null : t('lookups.detail.no-vehicle'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="font-mono text-2xl">{detail.identifier}</h2>
        </CardTitle>
        {vehicle && <CardDescription className="text-base">{vehicle}</CardDescription>}
        <CardAction>
          <StatusBadge tone={detail.tone}>{t(...detail.statusLabel)}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Facts
          className="grid-cols-2 md:grid-cols-3"
          items={[
            { label: t('lookups.detail.query'), value: detail.lookup.query ?? '-' },
            {
              label: t('lookups.detail.vin'),
              value: <span className="font-mono break-all">{detail.vin ?? '-'}</span>,
            },
            { label: t('lookups.columns.requester'), value: text(detail.searcher) },
            { label: t('lookups.columns.channel'), value: t(...detail.sourceLabel) },
            { label: t('lookups.columns.requested'), value: detail.requested },
          ]}
        />
      </CardContent>
    </Card>
  )
}
