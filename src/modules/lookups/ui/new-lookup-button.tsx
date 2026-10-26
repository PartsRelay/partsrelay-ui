import { Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { LookupPrefill } from '@/modules/lookups/core/lookup-form'
import { Button } from '@/ui/components/ui/button'

type NewLookupButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & {
  prefill?: LookupPrefill
}

export function NewLookupButton({ prefill, children, ...props }: NewLookupButtonProps) {
  const { t } = useTranslation()

  return (
    <Button {...props} asChild>
      <Link
        from="/searches/"
        to="/searches"
        search={(prev) => ({ ...prev, ...prefill, new: true })}
      >
        <PlusIcon data-icon="inline-start" />
        {children ?? t('lookups.new.open')}
      </Link>
    </Button>
  )
}
