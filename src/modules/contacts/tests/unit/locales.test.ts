import { describe, expect, it } from 'vite-plus/test'

type Texts = Record<string, Record<string, unknown>>

const files: Record<string, Texts> = import.meta.glob('@/locales/*/*.json', {
  eager: true,
  import: 'default',
})

function texts(locale: string, file: string) {
  const path = Object.keys(files).find((item) => item.endsWith(`/${locale}/${file}.json`))

  return path ? files[path]! : {}
}

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]

  return Object.entries(value)
    .flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

describe('contacts texts', () => {
  it('exist in English and Italian with the same keys', () => {
    const [english, italian] = ['en-US', 'it-IT'].map((locale) => ({
      contacts: keys(texts(locale, 'contacts')),
      pagination: keys(texts(locale, 'app').pagination),
      nav: keys(texts(locale, 'shell').nav),
      crumbs: keys(texts(locale, 'shell').crumbs),
    }))

    expect(english!.contacts.length).toBeGreaterThan(50)
    expect(italian).toEqual(english)
    expect(english!.pagination).toEqual(['label', 'next', 'previous', 'range'])
    expect(english!.nav).toContain('contacts')
    expect(english!.crumbs).toContain('contacts')
  })

  it('name every key in kebab case', () => {
    for (const key of keys(texts('en-US', 'contacts'))) {
      expect(key.replace(/_(one|other)$/, '')).toMatch(/^[a-z]+(-[a-z]+)*(\.[a-z]+(-[a-z]+)*)*$/)
    }
  })
})
