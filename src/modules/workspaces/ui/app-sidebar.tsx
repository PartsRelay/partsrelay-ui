import { Link, useLocation } from '@tanstack/react-router'
import { Building2Icon, type LucideIcon, UsersIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { navigation, pageAt, type Section } from '@/modules/workspaces/core/navigation'
import { roleLabel } from '@/modules/workspaces/core/role'
import { NavUser } from '@/modules/workspaces/ui/nav-user'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { useT } from '@/ui/hooks/use-t'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/ui/components/sidebar'

const icons: Record<Section, LucideIcon> = { team: UsersIcon, company: Building2Icon }

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const translate = useT()
  const { workspace, me } = useMe()
  const page = useLocation({ select: (location) => pageAt(location.pathname) })
  const items = navigation(me.permissions, page)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2Icon aria-hidden className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{workspace.name}</span>
                  <span className="truncate text-xs">{translate(roleLabel(me.role))}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {items.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.sections')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = icons[item.page]

                  return (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton asChild isActive={item.active}>
                        <Link to={item.path} aria-current={item.active ? 'page' : undefined}>
                          <Icon aria-hidden />
                          <span>{translate(item.label)}</span>
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
