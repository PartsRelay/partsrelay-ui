import { Link } from '@tanstack/react-router'
import { HouseIcon, LockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { accessHint } from '@/modules/workspaces/core/shell'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { Button } from '@/ui/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'

export function AccessDenied() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>
          <h1>{t('shell.access-denied.title')}</h1>
        </EmptyTitle>
        <EmptyDescription>{t(...accessHint(workspace))}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/">
            <HouseIcon data-icon="inline-start" />
            {t('shell.access-denied.back')}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
