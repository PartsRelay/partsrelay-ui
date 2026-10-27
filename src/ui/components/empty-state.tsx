import { cn } from 'cn'
import type { ComponentProps, ReactNode } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'

type EmptyStateProps = Omit<ComponentProps<typeof Empty>, 'title'> & {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Empty className={cn('border bg-card py-10', className)} {...props}>
      <EmptyHeader>
        {icon && (
          <EmptyMedia
            variant="icon"
            aria-hidden
            className="size-12 rounded-xl bg-secondary text-primary [&_svg:not([class*='size-'])]:size-6"
          >
            {icon}
          </EmptyMedia>
        )}
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}
