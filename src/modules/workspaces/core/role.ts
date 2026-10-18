import { message } from '@/core/message'

export const roles = ['owner', 'admin', 'viewer'] as const

export type Role = (typeof roles)[number]

export function isRole(value: unknown): value is Role {
  return roles.includes(value as Role)
}

export function toRole(value: string): Role {
  return isRole(value) ? value : 'viewer'
}

export function roleLabel(role: Role) {
  return message(`roles.${role}`)
}
