import { Link } from '@tanstack/react-router'
import { HouseIcon, LockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { accessHint } from '@/modules/workspaces/core/shell'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { EmptyState } from '@/ui/components/empty-state'
import { Button } from '@/ui/components/ui/button'

export function AccessDenied() {
  const { t } = useTranslation()
  const { workspace } = useMe()

  return (
    <EmptyState
      icon={<LockIcon />}
      title={<h1>{t('shell.access-denied.title')}</h1>}
      description={t(...accessHint(workspace))}
    >
      <Button asChild>
        <Link to="/">
          <HouseIcon data-icon="inline-start" />
          {t('shell.access-denied.back')}
        </Link>
      </Button>
    </EmptyState>
  )
}
