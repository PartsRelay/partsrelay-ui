import { useTranslation } from 'react-i18next'
import { workspaceSummary } from '@/modules/workspaces/core/workspace'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { PageHeader } from '@/ui/components/page-header'
import { Badge } from '@/ui/components/ui/badge'

export function WorkspaceHeader() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <PageHeader
      title={t('workspace.title')}
      description={t('workspace.description')}
      badge={
        <Badge variant="secondary">
          {workspaceSummary(workspace, new Date())
            .map((summary) => t(...summary))
            .join(' · ')}
        </Badge>
      }
    />
  )
}
