import { useSelector } from '@tanstack/react-form'
import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { useFormContext } from '@/form-context'
import { Button } from '@/ui/components/ui/button'
import { Spinner } from '@/ui/components/ui/spinner'

// Disabled with a spinner while the form submits
export function SubmitButton({
  disabled,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, 'type'>) {
  const form = useFormContext()
  const submitting = useSelector(form.store, (state) => state.isSubmitting)

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled}
      aria-disabled={submitting}
      className={cn('aria-disabled:opacity-50', className)}
    >
      {submitting && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  )
}
