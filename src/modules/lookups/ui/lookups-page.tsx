import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LookupQueue } from '@/modules/lookups/ui/lookup-queue'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { NewLookupSheet } from '@/modules/lookups/ui/new-lookup-sheet'
import { PageHeader } from '@/ui/components/page-header'

const route = getRouteApi('/_app/(lookups)/searches/')

export function LookupsPage() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const close = () =>
    void navigate({
      search: (prev) => ({ ...prev, new: undefined, plate: undefined }),
      replace: true,
    })

  return (
    <>
      <PageHeader
        title={t('lookups.title')}
        description={t('lookups.description')}
        action={<NewLookupButton />}
      />
      <LookupQueue />
      <NewLookupSheet open={search.new === true} plate={search.plate} onClose={close} />
    </>
  )
}
