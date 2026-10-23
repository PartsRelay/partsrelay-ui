import { Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/components/ui/button'

type NewLookupButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & { plate?: string }

export function NewLookupButton({ plate, children, ...props }: NewLookupButtonProps) {
  const { t } = useTranslation()

  return (
    <Button {...props} asChild>
      <Link to="/searches" search={(prev) => ({ ...prev, new: true, plate })}>
        <PlusIcon data-icon="inline-start" />
        {children ?? t('lookups.new.open')}
      </Link>
    </Button>
  )
}
