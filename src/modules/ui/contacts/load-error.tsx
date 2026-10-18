import { CircleAlertIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/modules/core/shared/errors'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/components/ui/empty'

type LoadErrorProps = { error: Error; onRetry: () => void }

export function LoadError({ error, onRetry }: LoadErrorProps) {
  const { t } = useTranslation()
  const translate = useT()

  return (
    <Empty role="alert" className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{translate(errorMessage(error))}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          {t('contacts.retry')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
