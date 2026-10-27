import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ScanSearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lookupRow } from '@/modules/lookups/core/lookup-row'
import { filtered, lookupListParams } from '@/modules/lookups/core/lookups'
import { lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { LookupFilters } from '@/modules/lookups/ui/lookup-filters'
import { LookupsTable } from '@/modules/lookups/ui/lookups-table'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PaginationBar } from '@/ui/components/pagination-bar'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'
import { Skeleton } from '@/ui/components/ui/skeleton'
import { usePageInfo } from '@/ui/hooks/use-page-info'

const route = getRouteApi('/_app/(lookups)/searches/')

function FirstLookup() {
  const { t } = useTranslation()
  const { me } = useMe()

  return (
    <>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearchIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t('lookups.empty.title')}</EmptyTitle>
        <EmptyDescription>{t('lookups.empty.description')}</EmptyDescription>
        <EmptyDescription>{t('lookups.empty.example')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
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
      </EmptyContent>
    </>
  )
}

function NoMatches() {
  const { t } = useTranslation()

  return (
    <>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearchIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t('lookups.empty.filtered')}</EmptyTitle>
        <EmptyDescription>{t('lookups.empty.filtered-description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" asChild>
          <Link to="/searches" search={{}}>
            {t('lookups.empty.clear')}
          </Link>
        </Button>
      </EmptyContent>
    </>
  )
}

export function LookupQueue() {
  const { t, i18n } = useTranslation()
  const text = useText()
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
        <CardTitle>
          <h2>{t('lookups.list.title')}</h2>
        </CardTitle>
        <CardDescription aria-live="polite">
          {info ? t('lookups.list.count', { count: info.total }) : t('lookups.list.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        {(!info || info.total > 0 || narrowed) && (
          <LookupFilters
            requester={first && !list.isPlaceholderData ? text(first.searcher) : undefined}
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
            ) : (
              <Empty className="border">{narrowed ? <NoMatches /> : <FirstLookup />}</Empty>
            )
          ) : list.isLoadingError ? (
            <LoadError error={list.error} onRetry={retry} />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
