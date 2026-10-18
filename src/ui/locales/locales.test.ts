import { describe, expect, it } from 'vite-plus/test'

const files = import.meta.glob<Record<string, unknown>>('./*/*.json', {
  eager: true,
  import: 'default',
})

function catalog(language: string) {
  const folder = `./${language}/`

  return Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => path.startsWith(folder))
      .map(([path, content]) => [path.slice(folder.length), content])
  )
}

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]

  return Object.entries(value)
    .flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

describe('locales', () => {
  const english = catalog('en')
  const italian = catalog('it')

  it('translates every file and key in both languages', () => {
    expect(Object.keys(italian).sort()).toEqual(Object.keys(english).sort())

    for (const [file, content] of Object.entries(english)) {
      expect(keys(italian[file]), file).toEqual(keys(content))
    }
  })

  it('keeps each top level key in one file, since files merge shallowly', () => {
    const roots = Object.values(english).flatMap((content) => Object.keys(content))

    expect(roots).toEqual([...new Set(roots)])
  })
})
