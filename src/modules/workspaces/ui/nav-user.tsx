import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSignOut } from '@/modules/auth/ui/use-sign-out'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/ui/components/ui/sidebar'

function Identity({ name, email, image }: { name: string; email: string; image: string | null }) {
  return (
    <>
      <Avatar>
        {image && <AvatarImage src={image} alt={name} />}
        <AvatarFallback>
          <UserIcon aria-hidden />
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
    </>
  )
}

export function NavUser() {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const { me } = useMe()
  const navigate = useNavigate()
  const { pending, signOut } = useSignOut()
  const { name, email, image } = me.member

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Identity name={name} email={email} image={image} />
              <ChevronsUpDownIcon aria-hidden className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Identity name={name} email={email} image={image} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserIcon aria-hidden />
                  {t('shell.user.profile')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              onSelect={async () => {
                if ((await signOut()).ok) await navigate({ to: '/login' })
              }}
            >
              <LogOutIcon aria-hidden />
              {t('shell.user.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
