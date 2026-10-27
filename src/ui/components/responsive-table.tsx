import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { DataTable } from '@/ui/components/data-table'

export function ResponsiveTable({ className, ...props }: ComponentProps<typeof DataTable>) {
  return (
    <div className="@container">
      <DataTable
        className={cn(
          '@max-4xl:block @max-4xl:[&_tbody]:block @max-4xl:[&_thead]:sr-only',
          '@max-4xl:[&_tr]:grid @max-4xl:[&_tr]:gap-2 @max-4xl:[&_tr]:p-4',
          '@max-4xl:[&_td]:w-auto @max-4xl:[&_td]:p-0 @max-4xl:[&_td]:whitespace-normal @max-4xl:[&_td]:wrap-anywhere @max-4xl:[&_td:empty]:hidden',
          '@max-4xl:[&_td[data-label]]:grid @max-4xl:[&_td[data-label]]:grid-cols-[8rem_minmax(0,1fr)] @max-4xl:[&_td[data-label]]:gap-4',
          '@max-4xl:[&_td[data-label]]:before:text-muted-foreground @max-4xl:[&_td[data-label]]:before:content-[attr(data-label)]',
          className
        )}
        {...props}
      />
    </div>
  )
}
