import { cn } from 'cn'
import type { ReactNode } from 'react'

export type Fact = { label: ReactNode; value: ReactNode }

export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  return (
    <dl className={cn('grid gap-4', className)}>
      {items.map(({ label, value }, index) => (
        <div key={index} className="grid gap-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
