import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { type Role, roleLabel, toRole } from '@/modules/workspaces/core/role'
import { ChoiceGroup } from '@/ui/components/choice-group'
import { FieldDescription, FieldSet, FieldTitle } from '@/ui/components/ui/field'

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
      <ChoiceGroup
        aria-labelledby={labelId}
        aria-describedby={hintId}
        options={roles.map((role) => ({ value: role, label: t(...roleLabel(role)) }))}
        value={value}
        onValueChange={(role) => onValueChange(toRole(role))}
      />
      <FieldDescription id={hintId}>{hint}</FieldDescription>
    </FieldSet>
  )
}
