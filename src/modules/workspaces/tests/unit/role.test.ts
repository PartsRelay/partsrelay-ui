import { describe, expect, it } from 'vite-plus/test'
import { isRole, roleLabel, toRole } from '@/modules/workspaces/core/role'

describe('isRole', () => {
  it('knows the roles of the core', () => {
    expect(['owner', 'admin', 'viewer'].every(isRole)).toBe(true)
    expect(isRole('member')).toBe(false)
    expect(isRole(undefined)).toBe(false)
  })
})

describe('toRole', () => {
  it('keeps a known role', () => {
    expect(toRole('admin')).toBe('admin')
  })

  it('gives the least rights to anything else', () => {
    expect(toRole('member')).toBe('viewer')
    expect(toRole(undefined)).toBe('viewer')
  })
})

describe('roleLabel', () => {
  it('translates the role', () => {
    expect(roleLabel('owner')).toEqual(['roles.owner'])
  })
})
