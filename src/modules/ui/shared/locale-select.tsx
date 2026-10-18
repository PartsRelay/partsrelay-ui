import type { ReactNode } from 'react'
import { type Locale, localeNames, locales, toLocale } from '@/modules/core/workspace/locale'
import { TextField } from '@/modules/ui/shared/text-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

type LocaleSelectProps = {
  label: ReactNode
  description?: ReactNode
  value: Locale
  disabled?: boolean
  onValueChange: (locale: Locale) => void
}

export function LocaleSelect({
  label,
  description,
  value,
  disabled,
  onValueChange,
}: LocaleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onValueChange(toLocale(next))}
    >
      <TextField label={label} description={description}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale} lang={locale}>
            {localeNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
