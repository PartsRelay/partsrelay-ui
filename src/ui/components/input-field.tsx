import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/ui/components/text-field'
import { Input } from '@/ui/components/ui/input'

export const MAX_STRING_LENGTH = 255

type InputFieldProps = Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'onChange'> & {
  field: AnyFieldApi
  label: ReactNode
  description?: ReactNode
}

export function InputField({
  field,
  label,
  description,
  required,
  maxLength = MAX_STRING_LENGTH,
  ...props
}: InputFieldProps) {
  const { t } = useTranslation()
  const [error] = field.state.meta.errors.map((item) =>
    typeof item === 'string' ? item : item?.message
  )

  return (
    <TextField
      label={label}
      required={required}
      description={description}
      error={error && t(error)}
    >
      <Input
        {...props}
        maxLength={maxLength}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </TextField>
  )
}
