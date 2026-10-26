import { describe, expect, it } from 'vite-plus/test'
import { LookupObjectSource, LookupObjectStatus } from '@/core/api/models'
import { lookupDetail } from '@/modules/lookups/core/lookup-detail'
import { lookupFieldErrors, plateError, queryError } from '@/modules/lookups/core/lookup-form'
import { textKey } from '@/modules/lookups/core/lookup-row'
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
      expect(key.replace(/_(one|other)$/, '')).toMatch(/^[a-z]+(-[a-z]+)*(\.[a-z]+(-[a-z]+)*)*$/)
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

  it('explain every outcome but the results and every error of a new search', () => {
    const english = keys(texts('en-US', 'lookups'))
    const workspace = workspaceFixture()
    const states = [
      ...Object.values(LookupObjectStatus).map((status) => lookupFixture(1, { status })),
      lookupFixture(1, { categories: undefined }),
    ].map((lookup) => lookupDetail(lookup, workspace, 'en-US').state)
    const outcomes = states
      .filter((state) => state !== 'results')
      .map((state) => `lookups.outcome.${textKey(state)}.description`)
    const errors = [
      ...['', 'A'].flatMap((value) => [plateError({ value }), queryError({ value })]),
      ...Object.values(lookupFieldErrors),
    ]

    expect(outcomes).toHaveLength(5)
    expect(english).toEqual(expect.arrayContaining([...outcomes, ...errors]))
  })
})
