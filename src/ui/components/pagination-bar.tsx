import { createLink } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { type PageMetadata, pageInfo } from '@/core/pagination'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/ui/pagination'

const PreviousLink = createLink(PaginationPrevious)
const NextLink = createLink(PaginationNext)

// The router renders a disabled link without href
const disabled = 'aria-disabled:pointer-events-none aria-disabled:opacity-50'

// Links to the other pages of the current address
export function PaginationBar({ metadata }: { metadata: PageMetadata }) {
  const { t } = useTranslation()
  const info = pageInfo(metadata)

  if (info.total === 0) return null

  return (
    <Pagination aria-label={t('pagination.label')} className="items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">{t(...info.range)}</span>
      <PaginationContent>
        <PaginationItem>
          <PreviousLink
            to="."
            search={(prev) => ({ ...prev, page: info.page - 1 })}
            disabled={!info.hasPrevious}
            tabIndex={0}
            text={t('pagination.previous')}
            aria-label={t('pagination.previous')}
            className={disabled}
          />
        </PaginationItem>
        <PaginationItem>
          <NextLink
            to="."
            search={(prev) => ({ ...prev, page: info.page + 1 })}
            disabled={!info.hasNext}
            tabIndex={0}
            text={t('pagination.next')}
            aria-label={t('pagination.next')}
            className={disabled}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
