import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'
import { FieldDescription, FieldSet, FieldTitle } from '@/ui/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/ui/components/ui/toggle-group'

type RoleFieldProps = {
  label: string
  hint: string
  roles: Role[]
  value: Role
  onValueChange: (role: Role) => void
}

export function RoleField({ label, hint, roles, value, onValueChange }: RoleFieldProps) {
  const { t } = useTranslation()
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
            {t(...roleLabel(role))}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription id={hintId}>{hint}</FieldDescription>
    </FieldSet>
  )
}
