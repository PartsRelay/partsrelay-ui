import type { ReactNode } from 'react'
import { Logo } from '@/ui/components/logo'

export function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="grid w-full max-w-md gap-6">
        <Logo className="justify-self-center" />
        {children}
      </div>
    </main>
  )
}
