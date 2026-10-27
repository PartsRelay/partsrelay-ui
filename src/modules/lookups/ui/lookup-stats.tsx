import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { statsView } from '@/modules/lookups/core/lookup-stats'
import { lookupStatsQuery } from '@/modules/lookups/core/lookups.query'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { CardHeading } from '@/ui/components/card-heading'
import { LoadError } from '@/ui/components/load-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Skeleton } from '@/ui/components/ui/skeleton'

type StatCardProps = { label: ReactNode; value: ReactNode; note: ReactNode }

function StatCard({ label, value, note }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-semibold tracking-wide uppercase">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{note}</CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="grid gap-4 md:grid-cols-3">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: 3 }, (_, index) => (
        <StatCard
          key={index}
          label={<Skeleton className="h-3 w-32" />}
          value={<Skeleton className="mt-1 h-8 w-16" />}
          note={<Skeleton className="h-4 w-44" />}
        />
      ))}
    </div>
  )
}

export function LookupStats() {
  const { t, i18n } = useTranslation()
  const text = useText()
  const stats = useQuery(lookupStatsQuery)
  const count = (value: number) => value.toLocaleString(i18n.language)

  if (stats.isLoadingError) {
    return <LoadError error={stats.error} onRetry={() => void stats.refetch()} />
  }
  if (!stats.data) return <StatsSkeleton />

  const view = statsView(stats.data)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {view.cards.map((card) => (
          <StatCard
            key={card.id}
            label={t(...card.label)}
            value={count(card.value)}
            note={t(...card.note)}
          />
        ))}
      </div>
      {view.topSearchers.length > 0 && (
        <Card>
          <CardHeader>
            <CardHeading>{t('lookups.stats.top.title')}</CardHeading>
            <CardDescription>
              {t('lookups.stats.top.description', { days: view.days })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {view.topSearchers.map(({ searcher, total, label }, index) => (
                <li key={index} className="grid content-start gap-1">
                  <span className="font-heading text-2xl font-semibold tabular-nums">
                    {count(total)}
                  </span>
                  {searcher ? (
                    <Link
                      to="/searches"
                      search={{ searcherType: searcher.type, searcherId: searcher.id }}
                      className="justify-self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {text(label)}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{text(label)}</span>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </>
  )
}
