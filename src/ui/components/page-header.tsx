import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  action?: ReactNode
}

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {badge}
        </div>
        {description && <p className="max-w-3xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  )
}
