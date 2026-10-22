import { cn } from 'cn'
import { env } from '@/env'
import logo from '@/ui/assets/logo.svg'
import reversedLogo from '@/ui/assets/logo-reversed.svg'

type LogoProps = { reversed?: boolean; className?: string }

export function Logo({ reversed = false, className }: LogoProps) {
  return (
    <img
      src={reversed ? reversedLogo : logo}
      alt={env.APP_NAME}
      className={cn('h-auto w-45', className)}
    />
  )
}
