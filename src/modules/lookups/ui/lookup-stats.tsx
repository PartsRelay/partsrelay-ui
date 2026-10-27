import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { statsView } from '@/modules/lookups/core/lookup-stats'
import { lookupStatsQuery } from '@/modules/lookups/core/lookups.query'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { LoadError } from '@/ui/components/load-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Skeleton } from '@/ui/components/ui/skeleton'

export function LookupStats() {
  const { t, i18n } = useTranslation()
  const text = useText()
  const stats = useQuery(lookupStatsQuery)
  const count = (value: number) => value.toLocaleString(i18n.language)

  if (stats.isLoadingError) {
    return <LoadError error={stats.error} onRetry={() => void stats.refetch()} />
  }
  if (!stats.data) return <Skeleton className="h-32 w-full" />

  const view = statsView(stats.data)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {view.cards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardDescription>{t(...card.label)}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{count(card.value)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t(...card.note)}</CardContent>
          </Card>
        ))}
      </div>
      {view.topSearchers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t('lookups.stats.top.title')}</h2>
            </CardTitle>
            <CardDescription>
              {t('lookups.stats.top.description', { days: view.days })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {view.topSearchers.map(({ searcher, total, label }, index) => (
                <li key={index} className="grid content-start gap-1">
                  <span className="text-2xl font-semibold tabular-nums">{count(total)}</span>
                  {searcher ? (
                    <Link
                      to="/searches"
                      search={{ searcherType: searcher.type, searcherId: searcher.id }}
                      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
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
