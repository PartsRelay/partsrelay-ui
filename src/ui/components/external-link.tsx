import { cn } from 'cn'
import type { ComponentProps } from 'react'

export function ExternalLink({ className, ...props }: ComponentProps<'a'>) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noreferrer"
      className={cn('underline-offset-4 hover:underline', className)}
    />
  )
}
