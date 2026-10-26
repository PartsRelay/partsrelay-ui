import { ArchiveXIcon, CarIcon, CircleAlertIcon, type LucideIcon, SearchXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LookupDetail, LookupState } from '@/modules/lookups/core/lookup-detail'
import { textKey } from '@/modules/lookups/core/lookup-row'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'
import { Spinner } from '@/ui/components/ui/spinner'

const icons: Record<Exclude<LookupState, 'results'>, LucideIcon> = {
  running: CarIcon,
  vehicle_not_found: CarIcon,
  not_matched: SearchXIcon,
  failed: CircleAlertIcon,
  unavailable: ArchiveXIcon,
}

export function LookupOutcome({ detail }: { detail: LookupDetail }) {
  const { t } = useTranslation()
  const state = detail.state === 'results' ? 'unavailable' : detail.state
  const Icon = icons[state]
  const running = state === 'running'

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {running ? <Spinner aria-hidden /> : <Icon aria-hidden />}
        </EmptyMedia>
        <EmptyTitle>
          <h2>{t(...detail.announcement)}</h2>
        </EmptyTitle>
        <EmptyDescription>{t(`lookups.outcome.${textKey(state)}.description`)}</EmptyDescription>
      </EmptyHeader>
      {!running && (
        <EmptyContent>
          <NewLookupButton prefill={detail.retry}>{t('lookups.detail.retry')}</NewLookupButton>
        </EmptyContent>
      )}
    </Empty>
  )
}
