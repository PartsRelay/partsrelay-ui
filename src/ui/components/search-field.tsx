import { useDebouncedCallback } from '@tanstack/react-pacer'
import { useState } from 'react'
import { TextField } from '@/ui/components/text-field'
import { Input } from '@/ui/components/ui/input'

type SearchFieldProps = {
  label: string
  placeholder?: string
  value?: string
  className?: string
  onSearch: (value?: string) => void
}

export function SearchField({ label, placeholder, value, className, onSearch }: SearchFieldProps) {
  const [text, setText] = useState(value ?? '')
  const [shown, setShown] = useState(value)
  const search = useDebouncedCallback((next: string) => onSearch(next || undefined), { wait: 300 })

  if (value !== shown) {
    setShown(value)
    setText(value ?? '')
  }

  return (
    <TextField label={label} className={className}>
      <Input
        type="search"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setText(event.target.value)
          search(event.target.value)
        }}
      />
    </TextField>
  )
}
