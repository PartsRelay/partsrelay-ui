import { CircleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/core/errors'
import { Callout } from '@/ui/components/callout'
import { EmptyState } from '@/ui/components/empty-state'
import { Button } from '@/ui/components/ui/button'

type LoadErrorProps = { error: Error; onRetry: () => void }

export function LoadError({ error, onRetry }: LoadErrorProps) {
  const { t } = useTranslation()

  return (
    <EmptyState role="alert" icon={<CircleAlertIcon />} title={t(...errorMessage(error))}>
      <Button variant="outline" onClick={onRetry}>
        {t('app.error.retry')}
      </Button>
    </EmptyState>
  )
}

export function RefetchError({
  error,
  onRetry,
  children,
}: LoadErrorProps & { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <Callout tone="danger" title={t(...errorMessage(error))}>
      <p>{children}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('app.error.retry')}
      </Button>
    </Callout>
  )
}
