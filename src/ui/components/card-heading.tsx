import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { CardTitle } from '@/ui/components/ui/card'

type CardHeadingProps = ComponentProps<'h2'> & { level?: 1 | 2 }

export function CardHeading({ level = 2, className, ...props }: CardHeadingProps) {
  const Heading = level === 1 ? 'h1' : 'h2'

  return (
    <CardTitle className={cn('wrap-anywhere', level === 1 ? 'text-xl' : 'text-lg')}>
      <Heading className={className} {...props} />
    </CardTitle>
  )
}
