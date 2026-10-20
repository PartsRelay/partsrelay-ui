import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { roleHint } from '@/modules/workspaces/core/invite-form'
import type { Role } from '@/modules/workspaces/core/role'
import { withRole } from '@/modules/workspaces/core/team'
import type { FullOrganization, Member } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { useAction } from '@/ui/hooks/use-action'
import { useReturnFocus } from '@/ui/hooks/use-return-focus'
import { RoleField } from '@/modules/workspaces/ui/role-field'
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
  const { me } = useMe()
  const [role, setRole] = useState(member.role)
  const { client, pending, run } = useAction()

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault()
        const result = await run(
          () =>
            optimistic<FullOrganization>(
              client,
              workspaceKey,
              (organization) => withRole(organization, member.id, role),
              () => authClient.organization.updateMemberRole({ memberId: member.id, role })
            ),
          { notice: `team.notices.roleChanged.${role}`, values: { name: member.name } }
        )
        if (result.ok) onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('team.changeRole.title', { name: member.name })}</DialogTitle>
        <DialogDescription>{t('team.changeRole.description')}</DialogDescription>
      </DialogHeader>
      <RoleField
        label={t('team.members.columns.role')}
        roles={roles}
        value={role}
        onValueChange={setRole}
        hint={t(...roleHint(role, me))}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">{t('confirm.cancel')}</Button>
        </DialogClose>
        <Button type="submit" disabled={role === member.role || pending}>
          {t('team.changeRole.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
