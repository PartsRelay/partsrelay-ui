import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import {
  CircleAlertIcon,
  HouseIcon,
  type LucideIcon,
  MapPinOffIcon,
  RotateCwIcon,
} from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/core/errors'
import { useT } from '@/ui/hooks/use-t'
import { Button } from '@/ui/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'

type StatusScreenProps = {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

function StatusScreen({ icon: Icon, title, description, children }: StatusScreenProps) {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link to="/" className="text-sm font-semibold">
        {t('app.name')}
      </Link>
      <Empty className="w-full max-w-md flex-none border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon aria-hidden />
          </EmptyMedia>
          <EmptyTitle>
            <h1>{title}</h1>
          </EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center">{children}</EmptyContent>
      </Empty>
    </main>
  )
}

function HomeLink() {
  const { t } = useTranslation()

  return (
    <Button variant="outline" asChild>
      <Link to="/">
        <HouseIcon data-icon="inline-start" />
        {t('app.goHome')}
      </Link>
    </Button>
  )
}

export function ErrorScreen({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const translate = useT()
  const router = useRouter()
  const queryErrorReset = useQueryErrorResetBoundary()

  useEffect(() => queryErrorReset.reset(), [queryErrorReset])

  return (
    <StatusScreen
      icon={CircleAlertIcon}
      title={t('app.error.title')}
      description={translate(errorMessage(error))}
    >
      <Button onClick={() => void router.invalidate()}>
        <RotateCwIcon data-icon="inline-start" />
        {t('app.error.retry')}
      </Button>
      <HomeLink />
    </StatusScreen>
  )
}

export function NotFoundScreen() {
  const { t } = useTranslation()

  return (
    <StatusScreen
      icon={MapPinOffIcon}
      title={t('app.notFound.title')}
      description={t('app.notFound.description')}
    >
      <HomeLink />
    </StatusScreen>
  )
}
