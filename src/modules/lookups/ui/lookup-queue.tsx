import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ScanSearchIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { pageInfo } from '@/core/pagination'
import { lookupRow } from '@/modules/lookups/core/lookup-row'
import { lookupListParams } from '@/modules/lookups/core/lookups'
import { lookupsQuery } from '@/modules/lookups/core/lookups.query'
import { useText } from '@/modules/lookups/ui/hooks/use-text'
import { LookupsTable } from '@/modules/lookups/ui/lookups-table'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { RequesterFilter } from '@/modules/lookups/ui/requester-filter'
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

const route = getRouteApi('/_app/(lookups)/searches/')

function NoLookups({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation()

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearchIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t(filtered ? 'lookups.empty.filtered' : 'lookups.empty.title')}</EmptyTitle>
        <EmptyDescription>
          {t(filtered ? 'lookups.empty.filtered-description' : 'lookups.empty.description')}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filtered ? (
          <Button variant="outline" asChild>
            <Link to="/searches" search={{}}>
              {t('lookups.empty.clear')}
            </Link>
          </Button>
        ) : (
          <NewLookupButton />
        )}
      </EmptyContent>
    </Empty>
  )
}

export function LookupQueue() {
  const { t, i18n } = useTranslation()
  const { workspace } = useMe()
  const text = useText()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const params = lookupListParams(search)
  const list = useQuery(lookupsQuery(params))
  const info = list.data && pageInfo(list.data.metadata)
  const lastPage = info?.outOfRange ? info.pages : undefined
  const rows = list.data?.data.map((lookup) => lookupRow(lookup, workspace, i18n.language))
  const [first] = rows ?? []
  const retry = () => void list.refetch()

  useEffect(() => {
    if (lastPage) void navigate({ search: (prev) => ({ ...prev, page: lastPage }), replace: true })
  }, [lastPage, navigate])

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
      <CardContent className="grid gap-4">
        <RequesterFilter selected={first && text(first.searcher)} />
        <div
          aria-busy={list.isPlaceholderData}
          className={cn('grid gap-4', list.isPlaceholderData && 'opacity-60')}
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
              <NoLookups filtered={params.searcherType !== undefined} />
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
