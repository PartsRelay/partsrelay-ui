import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon, MapPinOffIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { alreadyGone } from '@/core/errors'
import { lookupDetail } from '@/modules/lookups/core/lookup-detail'
import { lookupQuery } from '@/modules/lookups/core/lookups.query'
import { LookupOutcome } from '@/modules/lookups/ui/lookup-outcome'
import { LookupResults, LookupResultsSkeleton } from '@/modules/lookups/ui/lookup-results'
import { LookupVehicle, LookupVehicleSkeleton } from '@/modules/lookups/ui/lookup-vehicle'
import { Callout } from '@/ui/components/callout'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PageHeader } from '@/ui/components/page-header'
import { EmptyState } from '@/ui/components/empty-state'
import { Button } from '@/ui/components/ui/button'

const route = getRouteApi('/_app/(lookups)/searches/$lookupId')

function NotFound() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<MapPinOffIcon />}
      title={<h2>{t('app.not-found.title')}</h2>}
      description={t('app.not-found.description')}
    />
  )
}

export function LookupPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const { lookupId } = route.useParams()
  const lookup = useQuery(lookupQuery(Number(lookupId)))
  const detail = lookup.data && lookupDetail(lookup.data, i18n.language)
  const retry = () => void lookup.refetch()

  return (
    <>
      <PageHeader
        title={t('lookups.detail.title')}
        description={t('lookups.detail.description')}
        action={
          <Button variant="outline" asChild>
            <Link
              to="/searches"
              onClick={(event) => {
                if (!canGoBack) return
                event.preventDefault()
                router.history.back()
              }}
            >
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
      ) : lookup.isLoadingError && alreadyGone(lookup.error) ? (
        <NotFound />
      ) : lookup.isLoadingError ? (
        <LoadError error={lookup.error} onRetry={retry} />
      ) : (
        <>
          <LookupVehicleSkeleton />
          <LookupResultsSkeleton />
        </>
      )}
    </>
  )
}
