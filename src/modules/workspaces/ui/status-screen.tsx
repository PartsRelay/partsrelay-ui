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
import { Logo } from '@/ui/components/logo'
import { EmptyState } from '@/ui/components/empty-state'
import { Button } from '@/ui/components/ui/button'

type StatusScreenProps = {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

function StatusScreen({ icon: Icon, title, description, children }: StatusScreenProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link to="/" className="rounded-lg">
        <Logo />
      </Link>
      <EmptyState
        className="w-full max-w-md flex-none"
        icon={<Icon />}
        title={<h1>{title}</h1>}
        description={description}
      >
        <div className="flex flex-wrap justify-center gap-2">{children}</div>
      </EmptyState>
    </main>
  )
}

function HomeLink() {
  const { t } = useTranslation()

  return (
    <Button variant="outline" asChild>
      <Link to="/">
        <HouseIcon data-icon="inline-start" />
        {t('app.go-home')}
      </Link>
    </Button>
  )
}

export function ErrorScreen({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryErrorReset = useQueryErrorResetBoundary()

  useEffect(() => queryErrorReset.reset(), [queryErrorReset])

  return (
    <StatusScreen
      icon={CircleAlertIcon}
      title={t('app.error.title')}
      description={t(...errorMessage(error))}
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
      title={t('app.not-found.title')}
      description={t('app.not-found.description')}
    >
      <HomeLink />
    </StatusScreen>
  )
}
