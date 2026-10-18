import { useMatches } from '@tanstack/react-router'
import { Fragment } from 'react'
import { breadcrumbs } from '@/modules/workspaces/core/navigation'
import { useT } from '@/ui/components/use-t'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb'
import { Separator } from '@/ui/components/separator'
import { SidebarTrigger } from '@/ui/components/sidebar'

export function AppHeader() {
  const translate = useT()
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
                <Fragment key={label.key}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className={last ? undefined : 'hidden md:block'}>
                    {last ? <BreadcrumbPage>{translate(label)}</BreadcrumbPage> : translate(label)}
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
