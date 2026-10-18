import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '@/ui/components/card'
import { Skeleton } from '@/ui/components/skeleton'

export function InvitationSkeleton() {
  const { t } = useTranslation()

  return (
    <Card role="status" aria-busy>
      <span className="sr-only">{t('invitation.loading')}</span>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="grid gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}
