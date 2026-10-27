import { TextField } from '@/ui/components/text-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

type FilterSelectProps = {
  label: string
  value: string
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
}

export function FilterSelect({ label, value, options, onValueChange }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <TextField label={label}>
        <SelectTrigger className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
