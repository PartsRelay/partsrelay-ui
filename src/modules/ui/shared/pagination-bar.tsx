import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type PageMetadata, pageInfo } from '@/modules/core/shared/pagination'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'

type PaginationBarProps = { metadata: PageMetadata; onPage: (page: number) => void }

export function PaginationBar({ metadata, onPage }: PaginationBarProps) {
  const { t } = useTranslation()
  const translate = useT()
  const info = pageInfo(metadata)

  if (info.total === 0) return null

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">{translate(info.range)}</span>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('pagination.previous')}
        disabled={!info.hasPrevious}
        onClick={() => onPage(info.page - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('pagination.next')}
        disabled={!info.hasNext}
        onClick={() => onPage(info.page + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
