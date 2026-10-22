import { useMatches } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { breadcrumbs } from '@/modules/workspaces/core/navigation'
import { roleLabel } from '@/modules/workspaces/core/role'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

export function AppHeader() {
  const { t, i18n } = useTranslation()
  const { me } = useMe()
  const crumb = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.crumb)?.staticData.crumb,
  })
  return (
    <header className="workspace-header">
      <p>
        {crumb
          ? breadcrumbs(crumb)
              .map((label) => t(...label))
              .join(' / ')
          : t('design.workspace')}
      </p>
      <div className="header-meta">
        <span className="role-badge">{t(...roleLabel(me.role))}</span>
        <time dateTime={new Date().toISOString().slice(0, 10)}>
          {new Intl.DateTimeFormat(i18n.language, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).format(new Date())}
        </time>
      </div>
    </header>
  )
}
