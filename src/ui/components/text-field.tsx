import { Slot } from 'radix-ui'
import { type ReactElement, type ReactNode, useId } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/components/ui/field'

type TextFieldProps = {
  id?: string
  label: ReactNode
  required?: boolean
  description?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactElement
}

export function TextField({
  id,
  label,
  required,
  description,
  error,
  className,
  children,
}: TextFieldProps) {
  const fallback = useId()
  const hint = useId()
  const control = id ?? fallback
  const invalid = Boolean(error)

  return (
    <Field data-invalid={invalid || undefined} className={className}>
      <FieldLabel htmlFor={control}>
        {label}
        {required && (
          <span aria-hidden className="-ms-1 text-muted-foreground">
            *
          </span>
        )}
      </FieldLabel>
      <Slot.Root
        id={control}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={invalid || description ? hint : undefined}
      >
        {children}
      </Slot.Root>
      {invalid ? (
        <FieldError id={hint}>{error}</FieldError>
      ) : (
        description && <FieldDescription id={hint}>{description}</FieldDescription>
      )}
    </Field>
  )
}
