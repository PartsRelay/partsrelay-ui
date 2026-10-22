import { useTranslation } from 'react-i18next'
import type { Search } from '@/modules/searches/core/search'
import { Spinner } from '@/ui/components/ui/spinner'
export function SearchStatus({ status }: { status: Search['status'] }) {
  const { t } = useTranslation()
  return (
    <span className={`search-status status-${status}`}>
      {status === 'done' ? (
        <img src="/brand/check.svg" alt="" />
      ) : status === 'running' ? (
        <Spinner />
      ) : (
        <span aria-hidden>!</span>
      )}
      {t(`searches.status.${status}`)}
    </span>
  )
}
