import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { navigation, pageAt } from '@/modules/workspaces/core/navigation'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Button } from '@/ui/components/ui/button'

export function AppTabs() {
  const { t } = useTranslation()
  const { me } = useMe()
  const page = useLocation({ select: (location) => pageAt(location.pathname) })
  const items = navigation(me.permissions, page)

  return (
    <nav
      aria-label={t('nav.sections')}
      className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden"
    >
      {items.map((item) => (
        <Button key={item.page} variant={item.active ? 'secondary' : 'ghost'} size="sm" asChild>
          <Link to={item.path} aria-current={item.active ? 'page' : undefined}>
            {t(...item.label)}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
