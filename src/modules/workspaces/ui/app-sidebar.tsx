import { Link, useLocation } from '@tanstack/react-router'
import { BookUserIcon, Building2Icon, type LucideIcon, UsersIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { navigation, pageAt, type Section } from '@/modules/workspaces/core/navigation'
import { roleLabel } from '@/modules/workspaces/core/role'
import { NavUser } from '@/modules/workspaces/ui/nav-user'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Logo } from '@/ui/components/logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/ui/components/ui/sidebar'

const icons: Record<Section, LucideIcon> = {
  contacts: BookUserIcon,
  workspace: UsersIcon,
  company: Building2Icon,
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const { workspace, me } = useMe()
  const { setOpenMobile } = useSidebar()
  const close = () => setOpenMobile(false)
  const page = useLocation({ select: (location) => pageAt(location.pathname) })
  const items = navigation(me.permissions, page)

  return (
    <Sidebar collapsible="offcanvas" role="navigation" aria-label={t('nav.menu')} {...props}>
      <SidebarHeader>
        <Logo reversed className="m-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" onClick={close}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2Icon aria-hidden className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{workspace.name}</span>
                  <span className="truncate text-xs">{t(...roleLabel(me.role))}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {items.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = icons[item.page]

                  return (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.active}
                        className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                      >
                        <Link
                          to={item.path}
                          aria-current={item.active ? 'page' : undefined}
                          onClick={close}
                        >
                          <Icon aria-hidden />
                          <span>{t(...item.label)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
