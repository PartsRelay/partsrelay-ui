import { useTranslation } from 'react-i18next'
import { teamSummary } from '@/modules/workspaces/core/team'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { PageHeader } from '@/ui/components/page-header'
import { useT } from '@/ui/hooks/use-t'
import { Badge } from '@/ui/components/badge'

export function TeamHeader() {
  const { t } = useTranslation()
  const translate = useT()
  const { workspace } = useMe()

  return (
    <PageHeader
      title={t('team.title')}
      description={t('team.description')}
      badge={
        <Badge variant="secondary">
          {teamSummary(workspace, new Date()).map(translate).join(' · ')}
        </Badge>
      }
    />
  )
}
