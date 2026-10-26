import { message } from '@/core/message'

export const DEFAULT_PER_PAGE = 20

export const MAX_PER_PAGE = 100

export type PageMetadata = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export function pageInfo({ total, perPage, currentPage, lastPage }: PageMetadata) {
  const pages = Math.max(1, lastPage)
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, total)

  return {
    from,
    to,
    total,
    page: currentPage,
    pages,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < pages,
    outOfRange: total > 0 && from > total,
    range: message('pagination.range', { from, to, total }),
  }
}
