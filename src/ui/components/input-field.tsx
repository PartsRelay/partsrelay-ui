import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_STRING_LENGTH } from '@/core/strings'
import { useFieldContext } from '@/form-context'
import { TextField } from '@/ui/components/text-field'
import { Input } from '@/ui/components/ui/input'

type InputFieldProps = Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'onChange'> & {
  label: ReactNode
  description?: ReactNode
}

// An input bound to its field, errors are translation keys
export function InputField({
  label,
  description,
  required,
  maxLength = MAX_STRING_LENGTH,
  ...props
}: InputFieldProps) {
  const { t } = useTranslation()
  const field = useFieldContext<string>()
  const error = field.state.meta.errors.find((item): item is string => typeof item === 'string')

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
