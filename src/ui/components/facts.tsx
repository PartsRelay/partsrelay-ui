import { cn } from 'cn'
import type { ReactNode } from 'react'

export type Fact = { label: ReactNode; value: ReactNode }

export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  return (
    <dl className={cn('grid gap-4', className)}>
      {items.map(({ label, value }, index) => (
        <div key={index} className="grid content-start gap-1">
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
