import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'
import type { ComponentProps, ComponentType } from 'react'
import { Badge } from '@/ui/components/badge'
import { Spinner } from '@/ui/components/spinner'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

type Icon = ComponentType<ComponentProps<'svg'>>

const looks: Record<StatusTone, { variant: ComponentProps<typeof Badge>['variant']; icon?: Icon }> =
  {
    success: { variant: 'secondary', icon: CircleCheckIcon },
    warning: { variant: 'outline', icon: Spinner },
    danger: { variant: 'destructive', icon: CircleAlertIcon },
    neutral: { variant: 'secondary' },
  }

type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, 'variant'> & {
  tone: StatusTone
  icon?: Icon | null
}

export function StatusBadge({
  tone,
  icon: Icon = looks[tone].icon,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge variant={looks[tone].variant} {...props}>
      {Icon && <Icon data-icon="inline-start" aria-hidden />}
      {children}
    </Badge>
  )
}
