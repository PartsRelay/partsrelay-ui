import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { Table } from '@/ui/components/ui/table'

export function DataTable({ className, ...props }: ComponentProps<typeof Table>) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table
        className={cn(
          'tabular-nums [&_td]:px-3 [&_td]:py-3 [&_th]:px-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase [&_thead]:bg-muted/50',
          className
        )}
        {...props}
      />
    </div>
  )
}
