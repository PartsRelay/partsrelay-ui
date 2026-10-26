import { cn } from 'cn'
import { env } from '@/env'

type LogoProps = { reversed?: boolean; className?: string }

export function Logo({ reversed = false, className }: LogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}${reversed ? 'logo-reversed.svg' : 'logo.svg'}`}
      alt={env.APP_NAME}
      className={cn('h-auto w-45', className)}
    />
  )
}
