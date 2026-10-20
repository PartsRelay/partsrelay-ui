import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'
import { useT } from '@/ui/hooks/use-t'
import { ToggleGroup, ToggleGroupItem } from '@/ui/components/toggle-group'

type RoleToggleProps = {
  roles: Role[]
  value: Role
  onValueChange: (role: Role) => void
  label: string
}

export function RoleToggle({ roles, value, onValueChange, label }: RoleToggleProps) {
  const translate = useT()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label={label}
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
  )
}
