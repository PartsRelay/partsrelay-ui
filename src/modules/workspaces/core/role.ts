import { z } from 'zod'
import { message } from '@/core/message'

const roleSchema = z.enum(['owner', 'admin', 'viewer'])

export type Role = z.infer<typeof roleSchema>

export function isRole(value: unknown): value is Role {
  return roleSchema.safeParse(value).success
}

export function toRole(value: string | undefined): Role {
  return roleSchema.catch('viewer').parse(value)
}

export function roleLabel(role: Role) {
  return message(`roles.${role}`)
}
