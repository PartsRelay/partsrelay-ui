import { CircleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/core/errors'
import { Callout } from '@/ui/components/callout'
import { Button } from '@/ui/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/components/ui/empty'

type LoadErrorProps = { error: Error; onRetry: () => void }

export function LoadError({ error, onRetry }: LoadErrorProps) {
  const { t } = useTranslation()

  return (
    <Empty role="alert" className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t(...errorMessage(error))}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          {t('app.error.retry')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

// A failed refresh keeps the possibly stale rows
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
