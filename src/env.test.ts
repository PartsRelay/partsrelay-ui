import { describe, expect, it, vi } from 'vite-plus/test'
import { readEnv } from '@/env'

describe('public environment', () => {
  it('uses the real API by default and supports the existing Vite URL name', () => {
    expect(readEnv({ VITE_API_URL: 'http://localhost:3335' })).toMatchObject({
      API_URL: 'http://localhost:3335',
      API_MOCKS: false,
      LOCAL_REVIEW_AUTH: false,
    })
    expect(readEnv({ API_URL: 'https://api.example.com' }).API_URL).toBe('https://api.example.com')
  })

  it('does not serialize provider secrets into frontend configuration', () => {
    const configuration = readEnv({
      VITE_API_URL: 'https://api.example.com',
      RESEND_API_KEY: 'test-secret',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      VITE_UNRELATED_SECRET: 'test-secret',
    })
    expect(Object.keys(configuration).sort()).toEqual([
      'API_MOCKS',
      'API_URL',
      'APP_ENV',
      'APP_NAME',
      'GOOGLE_CLIENT_ID',
      'LOCAL_REVIEW_AUTH',
    ])
    expect(JSON.stringify(configuration)).not.toContain('test-secret')
  })

  it('requires an explicit mock flag and rejects it for builds and production', () => {
    expect(readEnv({ VITE_API_MOCKS: 'true' }).API_MOCKS).toBe(true)
    expect(readEnv({ VITE_API_MOCKS: 'false' }).API_MOCKS).toBe(false)
    expect(() => readEnv({ VITE_API_MOCKS: 'true' }, { isBuild: true })).toThrow('API mocks')
    expect(() => readEnv({ VITE_API_MOCKS: 'true' }, { mode: 'production' })).toThrow('API mocks')
    expect(() => readEnv({ VITE_API_MOCKS: 'true', APP_ENV: 'production' })).toThrow('API mocks')
  })

  it('rejects invalid API URL schemes and embedded credentials', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const value of ['javascript:alert(1)', 'https://user:password@api.example.com']) {
        expect(() => readEnv({ VITE_API_URL: value })).toThrow()
      }
    } finally {
      error.mockRestore()
    }
  })
})

describe('local review authentication boundary', () => {
  const local = {
    VITE_LOCAL_REVIEW_AUTH: 'true',
    VITE_API_URL: 'http://localhost:3335',
    APP_ENV: 'development',
  }

  it('requires an explicit public flag and the exact local API origin', () => {
    expect(readEnv(local).LOCAL_REVIEW_AUTH).toBe(true)
    expect(readEnv({ ...local, VITE_LOCAL_REVIEW_AUTH: 'false' }).LOCAL_REVIEW_AUTH).toBe(false)
    expect(
      readEnv({ API_URL: 'http://localhost:3335', VITE_LOCAL_REVIEW_AUTH: 'true' })
        .LOCAL_REVIEW_AUTH
    ).toBe(true)
    expect(readEnv({ LOCAL_REVIEW_AUTH: 'true' }).LOCAL_REVIEW_AUTH).toBe(false)
  })

  it.each(['development', 'production', 'staging'])(
    'rejects every build, including mode %s',
    (mode) => {
      expect(() => readEnv(local, { mode, isBuild: true })).toThrow('Local review authentication')
    }
  )

  it.each(['production', 'staging', 'test', 'preview', ''])(
    'rejects non-development mode %s even when APP_ENV is development',
    (mode) => {
      expect(() => readEnv(local, { mode })).toThrow('Local review authentication')
    }
  )

  it.each(['staging', 'production'])('rejects APP_ENV=%s in development mode', (APP_ENV) => {
    expect(() => readEnv({ ...local, APP_ENV }, { mode: 'development' })).toThrow(
      'Local review authentication'
    )
  })

  it('cannot combine seeded local authentication with API mocks', () => {
    expect(() => readEnv({ ...local, VITE_API_MOCKS: 'true' })).toThrow(
      'Local review authentication'
    )
  })

  it.each([
    '',
    'http://localhost:3335/',
    'http://127.0.0.1:3335',
    'https://localhost:3335',
    'http://localhost:3333',
    'http://localhost:3335/api',
    'http://localhost:3335?review=true',
    'http://localhost:3335#review',
    'https://api.example.com',
  ])('rejects an alternative API URL %s', (VITE_API_URL) => {
    expect(() => readEnv({ ...local, VITE_API_URL })).toThrow('Local review authentication')
  })

  it('does not let a local fallback override an explicit remote Vite API URL', () => {
    expect(() =>
      readEnv({
        ...local,
        API_URL: 'http://localhost:3335',
        VITE_API_URL: 'https://api.example.com',
      })
    ).toThrow('Local review authentication')
  })

  it('allows ordinary production configuration when the flag is disabled', () => {
    expect(
      readEnv(
        { VITE_LOCAL_REVIEW_AUTH: 'false', VITE_API_URL: 'https://api.example.com' },
        { mode: 'production', isBuild: true }
      )
    ).toMatchObject({ LOCAL_REVIEW_AUTH: false, APP_ENV: 'production', API_MOCKS: false })
  })

  it('rejects ambiguous boolean values instead of enabling a bypass', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const VITE_LOCAL_REVIEW_AUTH of ['1', 'yes', 'TRUE']) {
        expect(() => readEnv({ ...local, VITE_LOCAL_REVIEW_AUTH })).toThrow()
      }
    } finally {
      error.mockRestore()
    }
  })
})
