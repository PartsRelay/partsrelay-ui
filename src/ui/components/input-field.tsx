import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldContext } from '@/form'
import { TextField } from '@/ui/components/text-field'
import { Input } from '@/ui/components/ui/input'

type InputFieldProps = Omit<
  ComponentProps<typeof Input>,
  'name' | 'value' | 'onChange' | 'onBlur'
> & {
  label: ReactNode
  description?: ReactNode
}

// An input bound to its field, errors are translation keys
export function InputField({ label, description, required, ...props }: InputFieldProps) {
  const { t } = useTranslation()
  const field = useFieldContext<string>()
  const [error] = field.state.meta.errors

  return (
    <TextField
      label={label}
      required={required}
      description={description}
      error={error && t(error)}
    >
      <Input
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      />
    </TextField>
  )
}
