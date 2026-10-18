import { useTranslation } from 'react-i18next'
import { teamSummary } from '@/modules/core/team/team'
import { useMe } from '@/modules/ui/app/use-me'
import { PageHeader } from '@/modules/ui/shared/page-header'
import { useT } from '@/modules/ui/shared/use-t'
import { Badge } from '@/ui/components/ui/badge'

export function TeamHeader() {
  const { t } = useTranslation()
  const translate = useT()
  const { workspace } = useMe()

  return (
    <PageHeader
      title={t('team.title')}
      description={t('team.description')}
      badge={<Badge variant="secondary">{teamSummary(workspace).map(translate).join(' · ')}</Badge>}
    />
  )
}
