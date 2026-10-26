import { describe, expect, it } from 'vite-plus/test'
import { LookupObjectSource, LookupObjectStatus } from '@/core/api/models'
import { lookupDetail } from '@/modules/lookups/core/lookup-detail'
import { lookupFixture, workspaceFixture } from '@/modules/lookups/tests/unit/fixtures'

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

describe('lookups texts', () => {
  it('exist in English and Italian with the same keys', () => {
    const [english, italian] = ['en-US', 'it-IT'].map((locale) => keys(texts(locale, 'lookups')))

    expect(english!.length).toBeGreaterThan(15)
    expect(italian).toEqual(english)
  })

  it('name every key in kebab case', () => {
    for (const key of keys(texts('en-US', 'lookups'))) {
      expect(key).toMatch(/^[a-z]+(-[a-z]+)*(\.[a-z]+(-[a-z]+)*)*$/)
    }
  })

  it('cover every status and source the core sends', () => {
    const english = keys(texts('en-US', 'lookups'))
    const workspace = workspaceFixture()
    const used = [
      ...Object.values(LookupObjectStatus).flatMap((status) => {
        const detail = lookupDetail(lookupFixture(1, { status }), workspace, 'en-US')

        return [detail.statusLabel[0], detail.announcement[0]]
      }),
      ...Object.values(LookupObjectSource).map(
        (source) => lookupDetail(lookupFixture(1, { source }), workspace, 'en-US').sourceLabel[0]
      ),
      lookupDetail(lookupFixture(1, { categories: undefined }), workspace, 'en-US').announcement[0],
    ]

    expect(english).toEqual(expect.arrayContaining(used))
  })
})
