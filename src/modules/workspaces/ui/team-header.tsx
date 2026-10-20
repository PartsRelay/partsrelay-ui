import { useTranslation } from 'react-i18next'
import { teamSummary } from '@/modules/workspaces/core/team'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { PageHeader } from '@/ui/components/page-header'
import { Badge } from '@/ui/components/ui/badge'

export function TeamHeader() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <PageHeader
      title={t('team.title')}
      description={t('team.description')}
      badge={
        <Badge variant="secondary">
          {teamSummary(workspace, new Date())
            .map((summary) => t(...summary))
            .join(' · ')}
        </Badge>
      }
    />
  )
}
