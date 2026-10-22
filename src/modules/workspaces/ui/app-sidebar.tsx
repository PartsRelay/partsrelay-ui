import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { navigation, pageAt, type Section } from '@/modules/workspaces/core/navigation'
import { roleLabel } from '@/modules/workspaces/core/role'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'

const icons: Record<Section, string> = {
  searches: 'scan-search',
  contacts: 'messages',
  team: 'users',
  company: 'company',
}
export function AppSidebar() {
  const { t } = useTranslation()
  const { workspace, me } = useMe()
  const page = useLocation({ select: (location) => pageAt(location.pathname) })
  return (
    <aside className="workspace-sidebar" aria-label={t('design.navigation')}>
      <div className="sidebar-brand-row">
        <Link to="/searches" search={{ page: 1, requester: 'all' }} aria-label="Parts Relay">
          <img
            className="sidebar-logo"
            src="/brand/logo-sidebar.png"
            alt="Parts Relay"
            width="196"
            height="48"
          />
        </Link>
        <Link to="/profile" className="mobile-account">
          {me.member.name.split(' ')[0]} · {t(...roleLabel(me.role))}
        </Link>
      </div>
      <div className="workspace-label">
        <span className="eyebrow">{t('design.workspace')}</span>
        <strong>{workspace.name}</strong>
        <span>{t('design.shared-workspace')}</span>
      </div>
      <nav className="workspace-navigation">
        {navigation(me.permissions, page).map((item, index) => (
          <Link
            key={item.page}
            to={item.path}
            search={
              item.page === 'searches'
                ? { page: 1, requester: 'all' }
                : item.page === 'contacts'
                  ? { page: 1 }
                  : {}
            }
            className={item.active ? 'nav-item is-active' : 'nav-item'}
            aria-current={item.active ? 'page' : undefined}
          >
            <span className="nav-icon">
              <img src={`/brand/${icons[item.page]}.svg`} alt="" />
            </span>
            <span>{t(...item.label)}</span>
            <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-guidance">
        <p className="eyebrow">{t('design.shared-queue')}</p>
        <p>{t('design.channels')}</p>
      </div>
      <Link to="/profile" className="sidebar-account">
        <span className="initial-avatar">{me.member.name.slice(0, 1).toUpperCase()}</span>
        <span>
          <strong>{me.member.name}</strong>
          <small>
            {t(...roleLabel(me.role))} · {t('design.my-profile')}
          </small>
        </span>
      </Link>
    </aside>
  )
}
