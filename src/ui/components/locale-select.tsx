import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { locales } from '@/i18n'
import { TextField } from '@/ui/components/text-field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

type LocaleSelectProps = {
  label: ReactNode
  description?: ReactNode
  value: string
  disabled?: boolean
  onValueChange: (locale: string) => void
}

export function LocaleSelect({
  label,
  description,
  value,
  disabled,
  onValueChange,
}: LocaleSelectProps) {
  const { t } = useTranslation()

  return (
    <Select value={value} disabled={disabled} onValueChange={onValueChange}>
      <TextField label={label} description={description}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent>
        <SelectGroup>
          {locales.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {t(`languages.${locale}`)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
