import { useTranslation } from 'react-i18next'
import type { LookupDetail } from '@/modules/lookups/core/lookup-detail'
import { CardHeading } from '@/ui/components/card-heading'
import { type Fact, Facts } from '@/ui/components/facts'
import { StatusBadge } from '@/ui/components/status-badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { Skeleton } from '@/ui/components/ui/skeleton'

const facts = 'grid-cols-2 border-t pt-4 md:grid-cols-3'

export function LookupVehicle({ detail }: { detail: LookupDetail }) {
  const { t } = useTranslation()
  const vehicle =
    detail.vehicle ?? (detail.state === 'vehicle_not_found' ? t('lookups.detail.no-vehicle') : null)

  return (
    <Card className="dark">
      <CardHeader>
        <CardHeading className="text-3xl font-bold tracking-wide break-all">
          {detail.identifier}
        </CardHeading>
        {vehicle && (
          <CardDescription className="font-heading text-xl text-card-foreground">
            {vehicle}
          </CardDescription>
        )}
        <CardAction>
          <StatusBadge tone={detail.tone}>{t(...detail.statusLabel)}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Facts
          className={facts}
          items={[
            { label: t('lookups.detail.query'), value: detail.lookup.query ?? '-' },
            ...(detail.lookup.plate
              ? [
                  {
                    label: t('lookups.detail.vin'),
                    value: <span className="tracking-wide break-all">{detail.vin ?? '-'}</span>,
                  },
                ]
              : []),
            { label: t('lookups.columns.requester'), value: t(...detail.searcher) },
            { label: t('lookups.columns.channel'), value: t(...detail.sourceLabel) },
            { label: t('lookups.columns.requested'), value: detail.requested },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function LookupVehicleSkeleton() {
  const { t } = useTranslation()
  const placeholders: Fact[] = Array.from({ length: 5 }, () => ({
    label: <Skeleton className="h-3 w-20" />,
    value: <Skeleton className="h-4 w-28" />,
  }))

  return (
    <Card role="status" className="dark">
      <span className="sr-only">{t('common.loading')}</span>
      <CardHeader>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-6 w-56" />
      </CardHeader>
      <CardContent>
        <Facts className={facts} items={placeholders} />
      </CardContent>
    </Card>
  )
}
