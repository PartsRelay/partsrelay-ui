import { useId } from 'react'
import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'
import { useT } from '@/ui/hooks/use-t'
import { FieldDescription, FieldSet, FieldTitle } from '@/ui/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/ui/components/ui/toggle-group'

type RoleFieldProps = {
  label: string
  hint: string
  roles: Role[]
  value: Role
  onValueChange: (role: Role) => void
}

// The title names the choice once, the hint describes it
export function RoleField({ label, hint, roles, value, onValueChange }: RoleFieldProps) {
  const translate = useT()
  const labelId = useId()
  const hintId = useId()

  return (
    <FieldSet className="gap-2">
      <FieldTitle id={labelId}>{label}</FieldTitle>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-labelledby={labelId}
        aria-describedby={hintId}
        value={value}
        onValueChange={(role) => {
          if (role) onValueChange(toRole(role))
        }}
      >
        {roles.map((role) => (
          <ToggleGroupItem key={role} value={role}>
            {translate(roleLabel(role))}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription id={hintId}>{hint}</FieldDescription>
    </FieldSet>
  )
}
