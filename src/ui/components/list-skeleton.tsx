import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/ui/components/ui/skeleton'

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  const { t } = useTranslation()

  return (
    <div role="status" className="overflow-hidden rounded-lg border">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="h-10 border-b bg-muted/50" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-6 border-b px-3 py-3.5 last:border-0">
          <Skeleton className="h-4 w-20" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-5 w-24 rounded-full sm:block" />
        </div>
      ))}
    </div>
  )
}
