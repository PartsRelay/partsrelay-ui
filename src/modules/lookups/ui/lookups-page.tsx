import { getRouteApi, useCanGoBack, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { greeting } from '@/modules/lookups/core/lookup-stats'
import { LookupQueue } from '@/modules/lookups/ui/lookup-queue'
import { LookupStats } from '@/modules/lookups/ui/lookup-stats'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { NewLookupSheet } from '@/modules/lookups/ui/new-lookup-sheet'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PageHeader } from '@/ui/components/page-header'

const route = getRouteApi('/_app/(lookups)/searches/')

export function LookupsPage() {
  const { t } = useTranslation()
  const { me } = useMe()
  const { new: open, plate, vin, query } = route.useSearch()
  const navigate = route.useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const close = () =>
    canGoBack
      ? router.history.back()
      : void navigate({
          search: (prev) => ({
            ...prev,
            new: undefined,
            plate: undefined,
            vin: undefined,
            query: undefined,
          }),
          replace: true,
        })

  return (
    <>
      <PageHeader
        title={t(...greeting(me.member.name, new Date()))}
        description={t('lookups.description')}
        action={<NewLookupButton />}
      />
      {me.permissions.viewStats && <LookupStats />}
      <LookupQueue />
      <NewLookupSheet open={open === true} prefill={{ plate, vin, query }} onClose={close} />
    </>
  )
}
