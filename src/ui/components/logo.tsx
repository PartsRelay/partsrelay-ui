import { cn } from 'cn'
import logo from '@/assets/logo.svg'
import reversedLogo from '@/assets/logo-reversed.svg'
import { env } from '@/env'

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
