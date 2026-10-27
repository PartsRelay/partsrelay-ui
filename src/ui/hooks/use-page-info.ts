import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { type PageMetadata, pageInfo } from '@/core/pagination'

export function usePageInfo(metadata: PageMetadata | undefined) {
  const navigate = useNavigate()
  const info = metadata && pageInfo(metadata)
  const lastPage = info?.outOfRange ? info.pages : undefined

  useEffect(() => {
    if (lastPage) {
      void navigate({ to: '.', search: (prev) => ({ ...prev, page: lastPage }), replace: true })
    }
  }, [lastPage, navigate])

  return info
}
