import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lookupDetail } from '@/modules/lookups/core/lookup-detail'
import { lookupQuery } from '@/modules/lookups/core/lookups.query'
import { LookupOutcome } from '@/modules/lookups/ui/lookup-outcome'
import { LookupResults } from '@/modules/lookups/ui/lookup-results'
import { LookupVehicle } from '@/modules/lookups/ui/lookup-vehicle'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Callout } from '@/ui/components/callout'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PageHeader } from '@/ui/components/page-header'
import { Button } from '@/ui/components/ui/button'
import { Skeleton } from '@/ui/components/ui/skeleton'

const route = getRouteApi('/_app/(lookups)/searches/$lookupId')

export function LookupPage() {
  const { t, i18n } = useTranslation()
  const { workspace } = useMe()
  const { lookupId } = route.useParams()
  const lookup = useQuery(lookupQuery(Number(lookupId)))
  const detail = lookup.data && lookupDetail(lookup.data, workspace, i18n.language)
  const retry = () => void lookup.refetch()

  return (
    <>
      <PageHeader
        title={t('lookups.detail.title')}
        description={t('lookups.detail.description')}
        action={
          <Button variant="outline" asChild>
            <Link to="/searches">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('lookups.detail.back')}
            </Link>
          </Button>
        }
      />
      {lookup.isRefetchError && (
        <RefetchError error={lookup.error} onRetry={retry}>
          {t('lookups.detail.stale')}
        </RefetchError>
      )}
      {detail ? (
        <>
          <p role="status" className="sr-only">
            {t(...detail.announcement)}
          </p>
          <LookupVehicle detail={detail} />
          {detail.state === 'results' ? (
            <>
              <LookupResults categories={detail.categories} />
              <Callout>{t('lookups.fitment')}</Callout>
            </>
          ) : (
            <LookupOutcome detail={detail} />
          )}
        </>
      ) : lookup.isLoadingError ? (
        <LoadError error={lookup.error} onRetry={retry} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </>
  )
}
