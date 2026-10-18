import { CircleAlertIcon, InfoIcon, type LucideIcon, TriangleAlertIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert'

export type CalloutTone = 'info' | 'warning' | 'danger' | 'neutral'

const icons: Record<CalloutTone, LucideIcon | null> = {
  info: InfoIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
  neutral: null,
}

type CalloutProps = Omit<ComponentProps<typeof Alert>, 'title' | 'variant'> & {
  tone?: CalloutTone
  title?: ReactNode
  icon?: LucideIcon | null
}

export function Callout({
  tone = 'info',
  title,
  icon: Icon = icons[tone],
  children,
  ...props
}: CalloutProps) {
  return (
    <Alert
      variant={tone === 'danger' ? 'destructive' : 'default'}
      role={tone === 'danger' ? 'alert' : undefined}
      {...props}
    >
      {Icon && <Icon aria-hidden />}
      {title && <AlertTitle>{title}</AlertTitle>}
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}
