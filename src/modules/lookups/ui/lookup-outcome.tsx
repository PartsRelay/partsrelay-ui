import {
  ArchiveXIcon,
  CarIcon,
  CircleAlertIcon,
  CircleQuestionMarkIcon,
  type LucideIcon,
  SearchXIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LookupDetail, LookupState } from '@/modules/lookups/core/lookup-detail'
import { textKey } from '@/modules/lookups/core/lookup-row'
import { NewLookupButton } from '@/modules/lookups/ui/new-lookup-button'
import { EmptyState } from '@/ui/components/empty-state'
import { Spinner } from '@/ui/components/ui/spinner'

const icons: Record<Exclude<LookupState, 'results'>, LucideIcon> = {
  running: CarIcon,
  vehicle_not_found: CircleQuestionMarkIcon,
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
    <EmptyState
      icon={running ? <Spinner /> : <Icon />}
      title={<h2>{t(...detail.announcement)}</h2>}
      description={t(`lookups.outcome.${textKey(state)}.description`)}
    >
      {!running && (
        <NewLookupButton prefill={detail.retry}>{t('lookups.detail.retry')}</NewLookupButton>
      )}
    </EmptyState>
  )
}
