import { describe, expect, it } from 'vite-plus/test'
import { legalLinks } from '@/core/legal'

describe('legal links', () => {
  it('shows only the links whose address is set, help first', () => {
    expect(legalLinks({})).toEqual([])
    expect(
      legalLinks({
        TERMS_URL: 'https://partsrelay.example/terms',
        SUPPORT_URL: 'https://partsrelay.example/help',
      })
    ).toEqual([
      { id: 'help', url: 'https://partsrelay.example/help' },
      { id: 'terms', url: 'https://partsrelay.example/terms' },
    ])
  })
})
