import { useSelector } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { authClient } from '@/modules/auth/core/auth.client'
import { optimistic } from '@/core/optimistic'
import { roleHint } from '@/modules/workspaces/core/invite-form'
import type { Role } from '@/modules/workspaces/core/role'
import { type FullOrganization, type Member, withRole } from '@/modules/workspaces/core/workspace'
import { workspaceKey } from '@/modules/workspaces/core/workspace.query'
import { useMe } from '@/modules/workspaces/ui/use-me'
import { useAppForm } from '@/form'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
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
  const { client, run } = useBetterAuthAction()
  const form = useAppForm({
    defaultValues: { role: member.role },
    onSubmit: async ({ value: { role } }) => {
      const result = await run(
        () =>
          optimistic<FullOrganization>(
            client,
            workspaceKey,
            (organization) => withRole(organization, member.id, role),
            () => authClient.organization.updateMemberRole({ memberId: member.id, role })
          ),
        { notice: `team.notices.role-changed.${role}`, values: { name: member.name } }
      )
      if (result.ok) onDone()
    },
  })
  const role = useSelector(form.store, (state) => state.values.role)

  return (
    <form.AppForm>
      <form.Form className="grid gap-4">
        <DialogHeader>
          <DialogTitle>{t('team.change-role.title', { name: member.name })}</DialogTitle>
          <DialogDescription>{t('team.change-role.description')}</DialogDescription>
        </DialogHeader>
        <form.Field name="role">
          {(field) => (
            <RoleField
              label={t('team.members.columns.role')}
              roles={roles}
              value={field.state.value}
              onValueChange={field.handleChange}
              hint={t(...roleHint(field.state.value, me))}
            />
          )}
        </form.Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('confirm.cancel')}</Button>
          </DialogClose>
          <form.SubmitButton disabled={role === member.role}>
            {t('team.change-role.save')}
          </form.SubmitButton>
        </DialogFooter>
      </form.Form>
    </form.AppForm>
  )
}
