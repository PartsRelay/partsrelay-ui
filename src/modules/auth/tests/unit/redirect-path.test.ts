import { describe, expect, it } from 'vite-plus/test'
import { redirectPath } from '@/modules/auth/core/redirect-path'

describe('redirectPath', () => {
  it.each(['/', '/workspace', '/company?tab=name', '/invitations/31#accept'])(
    'keeps the app path %j',
    (path) => {
      expect(redirectPath(path)).toBe(path)
    }
  )

  it.each([
    '//evil.example',
    '/\\evil.example',
    'https://evil.example/workspace',
    'workspace',
    '',
    undefined,
    null,
    42,
  ])('falls back to the home page for %j', (path) => {
    expect(redirectPath(path)).toBe('/')
  })
})
