import { type AnyFormApi, useSelector } from '@tanstack/react-form'
import { cn } from 'cn'
import type { ComponentProps } from 'react'
import { Button } from '@/ui/components/ui/button'
import { Spinner } from '@/ui/components/ui/spinner'

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type' | 'form'> & {
  form: AnyFormApi
}

export function SubmitButton({ form, disabled, className, children, ...props }: SubmitButtonProps) {
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
