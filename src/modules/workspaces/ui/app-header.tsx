import { useMatches } from '@tanstack/react-router'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { breadcrumbs } from '@/modules/workspaces/core/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/ui/breadcrumb'
import { Separator } from '@/ui/components/ui/separator'
import { SidebarTrigger } from '@/ui/components/ui/sidebar'

export function AppHeader() {
  const { t } = useTranslation()
  const crumb = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData.crumb)?.staticData.crumb,
  })
  const trail = crumb ? breadcrumbs(crumb) : []

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      {trail.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((label, index) => {
              const last = index === trail.length - 1

              return (
                <Fragment key={label[0]}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className={last ? undefined : 'hidden md:block'}>
                    {last ? <BreadcrumbPage>{t(...label)}</BreadcrumbPage> : t(...label)}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </header>
  )
}
