import type { ComponentProps, ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/ui/components/ui/toggle-group'

type ChoiceGroupProps = Pick<
  ComponentProps<'div'>,
  'aria-label' | 'aria-labelledby' | 'aria-describedby'
> & {
  options: { value: string; label: ReactNode }[]
  value: string
  onValueChange: (value: string) => void
}

export function ChoiceGroup({ options, value, onValueChange, ...props }: ChoiceGroupProps) {
  return (
    <ToggleGroup
      {...props}
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
