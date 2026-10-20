import type { ReactNode } from 'react'
import { CardTitle } from '@/ui/components/ui/card'

export function AuthTitle({ children }: { children: ReactNode }) {
  return (
    <CardTitle className="wrap-anywhere">
      <h1>{children}</h1>
    </CardTitle>
  )
}
