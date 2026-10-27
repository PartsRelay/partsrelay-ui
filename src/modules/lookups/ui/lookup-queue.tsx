import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ScanSearchIcon, SearchXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lookupRow } from '@/modules/lookups/core/lookup-row'
import { filtered, lookupListParams } from '@/modules/lookups/core/lookups'
import { lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { LookupFilters } from '@/modules/lookups/ui/lookup-filters'
import { LookupsTable } from '@/modules/lookups/ui/lookups-table'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { CardHeading } from '@/ui/components/card-heading'
import { EmptyState } from '@/ui/components/empty-state'
import { ListSkeleton } from '@/ui/components/list-skeleton'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PaginationBar } from '@/ui/components/pagination-bar'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { usePageInfo } from '@/ui/hooks/use-page-info'

const route = getRouteApi('/_app/(lookups)/lookups/')

function FirstLookup() {
  const { t } = useTranslation()
  const { me } = useMe()

  return (
    <EmptyState
      icon={<ScanSearchIcon />}
      title={t('lookups.empty.title')}
      description={t('lookups.empty.description')}
    >
      <p className="rounded-lg border bg-muted/50 px-3 py-2 font-medium">
        {t('lookups.empty.example')}
      </p>
      <NewLookupButton>{t('lookups.empty.start')}</NewLookupButton>
      <div className="flex flex-wrap justify-center gap-x-4">
        {me.permissions.viewWorkspace && (
          <Button variant="link" asChild>
            <Link to="/workspace">{t('lookups.empty.invite')}</Link>
          </Button>
        )}
        <Button variant="link" asChild>
          <Link to="/contacts">{t('lookups.empty.connect')}</Link>
        </Button>
      </div>
    </EmptyState>
  )
}

function NoMatches() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<SearchXIcon />}
      title={t('lookups.empty.filtered')}
      description={t('lookups.empty.filtered-description')}
    >
      <Button variant="outline" asChild>
        <Link to="/lookups" search={{}}>
          {t('lookups.empty.clear')}
        </Link>
      </Button>
    </EmptyState>
  )
}

export function LookupQueue() {
  const { t, i18n } = useTranslation()
  const search = route.useSearch()
  const list = useQuery(lookupsQuery(lookupListParams(search)))
  const narrowed = filtered(search)
  const info = usePageInfo(list.data?.metadata)
  const rows = list.data?.data.map((lookup) => lookupRow(lookup, i18n.language))
  const [first] = rows ?? []
  const retry = () => void list.refetch()

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('lookups.list.title')}</CardHeading>
        <CardDescription aria-live="polite">
          {info ? t('lookups.list.count', { count: info.total }) : t('lookups.list.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        {(!info || info.total > 0 || narrowed) && (
          <LookupFilters
            requester={first && !list.isPlaceholderData ? t(...first.searcher) : undefined}
          />
        )}
        <div
          aria-busy={list.isPlaceholderData}
          className={cn('grid grid-cols-1 gap-4', list.isPlaceholderData && 'opacity-60')}
        >
          {list.isRefetchError && (
            <RefetchError error={list.error} onRetry={retry}>
              {t('lookups.list.stale')}
            </RefetchError>
          )}
          {list.data && rows && !info?.outOfRange ? (
            rows.length > 0 ? (
              <>
                <LookupsTable rows={rows} />
                <PaginationBar metadata={list.data.metadata} />
              </>
            ) : narrowed ? (
              <NoMatches />
            ) : (
              <FirstLookup />
            )
          ) : list.isLoadingError ? (
            <LoadError error={list.error} onRetry={retry} />
          ) : (
            <ListSkeleton />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
