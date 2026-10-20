import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { Button } from '@/ui/components/ui/button'

export function ActionButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button variant="link" className={cn('h-auto p-0', className)} {...props} />
}
