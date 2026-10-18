import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { roleHint } from '@/modules/core/team/invite-form'
import { changeRoleMutation } from '@/modules/core/team/team.mutation'
import type { Role } from '@/modules/core/workspace/role'
import type { Member } from '@/modules/core/workspace/workspace'
import { useMe } from '@/modules/ui/app/use-me'
import { useReturnFocus } from '@/modules/ui/shared/use-return-focus'
import { useT } from '@/modules/ui/shared/use-t'
import { RoleToggle } from '@/modules/ui/team/role-toggle'
import { Button } from '@/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/ui/dialog'

type ChangeRoleDialogProps = {
  member: Member
  roles: Role[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeRoleDialog({ member, roles, open, onOpenChange }: ChangeRoleDialogProps) {
  const returnFocus = useReturnFocus(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} onCloseAutoFocus={returnFocus}>
        <ChangeRoleForm member={member} roles={roles} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type ChangeRoleFormProps = { member: Member; roles: Role[]; onDone: () => void }

function ChangeRoleForm({ member, roles, onDone }: ChangeRoleFormProps) {
  const { t } = useTranslation()
  const translate = useT()
  const { me } = useMe()
  const [role, setRole] = useState(member.role)
  const changeRole = useMutation(changeRoleMutation(member))

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        changeRole.mutate(role, { onSuccess: onDone })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('team.changeRole.title', { name: member.name })}</DialogTitle>
        <DialogDescription>{t('team.changeRole.description')}</DialogDescription>
      </DialogHeader>
      <RoleToggle
        label={t('team.members.columns.role')}
        roles={roles}
        value={role}
        onValueChange={setRole}
      />
      <p className="text-sm text-muted-foreground">{translate(roleHint(role, me))}</p>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">{t('confirm.cancel')}</Button>
        </DialogClose>
        <Button type="submit" disabled={role === member.role || changeRole.isPending}>
          {t('team.changeRole.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
