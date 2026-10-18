import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements } from 'better-auth/plugins/organization/access'

export const ac = createAccessControl(defaultStatements)

export const roles = {
  owner: ac.newRole({
    organization: ['update', 'delete'],
    member: ['update', 'delete'],
    invitation: ['create', 'cancel'],
  }),
  admin: ac.newRole({ member: ['delete'], invitation: ['create', 'cancel'] }),
  viewer: ac.newRole({}),
}
