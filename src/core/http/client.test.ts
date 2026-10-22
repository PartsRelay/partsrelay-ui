import { describe, expect, it, vi } from 'vite-plus/test'
import type { InternalAxiosRequestConfig } from 'axios'
import { http } from '@/core/http/client'

vi.mock('@/env', () => ({ env: { API_URL: 'https://api.example.com' } }))
vi.mock('@/i18n', () => ({ i18n: { language: 'it' } }))

describe('business API transport', () => {
  it('sends cookies, locale and cancellation signal and returns the API body', async () => {
    const abort = new AbortController()
    let received: InternalAxiosRequestConfig | undefined
    const result = await http<{ data: { id: number } }>({
      url: '/api/v1/lookups/1',
      signal: abort.signal,
      withCredentials: false,
      adapter: async (config) => {
        received = config
        return { config, data: { data: { id: 1 } }, status: 200, statusText: 'OK', headers: {} }
      },
    })
    expect(result).toEqual({ data: { id: 1 } })
    expect(received?.baseURL).toBe('https://api.example.com')
    expect(received?.withCredentials).toBe(true)
    expect(received?.headers.get('Accept-Language')).toBe('it')
    expect(received?.signal).toBe(abort.signal)
    expect(received?.headers.get('Authorization')).toBeUndefined()
  })
})
