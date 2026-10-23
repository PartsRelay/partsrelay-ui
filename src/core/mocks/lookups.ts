import { subMinutes } from 'date-fns'
import {
  getGetApiV1LookupsLookupIdMockHandler,
  getPostApiV1LookupsMockHandler,
} from '@/core/api/endpoints/lookups/lookups.msw'
import { getGetApiV1WorkspaceLookupsMockHandler } from '@/core/api/endpoints/workspace-lookups/workspace-lookups.msw'
import {
  type LookupObject,
  type LookupObjectStatus,
  type PostApiV1LookupsBody,
  type Searcher,
  SearcherType,
} from '@/core/api/models'
import { fail, invalid, member } from '@/core/mocks/auth'
import { page, people, type Person } from '@/core/mocks/data'
import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '@/core/pagination'

type Text = [en: string, it: string]

type Language = 0 | 1

type Match = [brand: string, code: string, description: string, price: number | null]

type Category = {
  name: Text
  words: string[]
  unit: { code: string; name: Text; image: boolean }
  original: { code: string; name: Text; price: number | null; aftermarket: Match[] }[]
}

type Stored = Omit<LookupObject, 'searcher' | 'vehicleDescription' | 'categories'> & {
  company: string
  searcher: Searcher
  gone?: boolean
  cached: boolean
}

type Archive = { lookups: Stored[]; nextId: number }

const PLATE = /^[A-Z0-9]{4,8}$/
const MAX_NODES = 25
const STALE_MINUTES = 15
const FAILING_PLATE = 'ER500ER'

const VEHICLES: Record<string, { vin: string; description: string }> = {
  CA770NE: { vin: 'ZFA31200003456789', description: 'Fiat Panda 1.2' },
  GH482KL: { vin: 'ZFA31200007712345', description: 'Fiat Panda 1.2 8V' },
  FT915ZR: { vin: 'WVWZZZAUZHW204411', description: 'Volkswagen Golf VII 2.0 TDI' },
  DK318MP: { vin: 'VF1RFB00X56123456', description: 'Renault Clio IV 1.5 dCi' },
}

const CATALOG: Record<string, Category> = {
  g1: {
    name: ['Oil filter', 'Filtro olio'],
    words: ['oil', 'olio'],
    unit: { code: 'u1', name: ['Engine oil filter', 'Filtro olio motore'], image: true },
    original: [
      {
        code: '55256470',
        name: ['Oil filter', 'Filtro olio'],
        price: null,
        aftermarket: [
          ['MANN-FILTER', 'W 712/95', 'Oil filter', null],
          ['BOSCH', 'F 026 407 209', 'Oil filter', null],
          ['UFI', '23.123.00', 'Oil filter', null],
        ],
      },
    ],
  },
  g2: {
    name: ['Air filter', 'Filtro aria'],
    words: ['air', 'aria'],
    unit: { code: 'u2', name: ['Air filter housing', 'Scatola filtro aria'], image: true },
    original: [
      {
        code: '51854724',
        name: ['Air filter', 'Filtro aria'],
        price: null,
        aftermarket: [
          ['MANN-FILTER', 'C 2433/2', 'Air filter', null],
          ['MAHLE', 'LX 2826', 'Air filter', null],
        ],
      },
    ],
  },
  g4: {
    name: ['Front brake pads', 'Pastiglie freno anteriori'],
    words: ['brake', 'pad', 'freno', 'freni', 'pastiglie'],
    unit: { code: 'u4', name: ['Front brake', 'Freno anteriore'], image: true },
    original: [
      {
        code: '77367141',
        name: ['Front brake pad set', 'Kit pastiglie freno anteriori'],
        price: 84.2,
        aftermarket: [
          ['BREMBO', 'P 23 141', 'Brake pad set, disc brake', 38.7],
          ['TRW', 'GDB1891', 'Brake pad set, disc brake', 46.9],
          ['BOSCH', '0 986 494 597', 'Brake pad set, disc brake', 52.4],
        ],
      },
    ],
  },
  g5: {
    name: ['Clutch kit', 'Kit frizione'],
    words: ['clutch', 'frizione'],
    unit: { code: 'u5', name: ['Clutch', 'Frizione'], image: false },
    original: [
      { code: '55238862', name: ['Clutch kit', 'Kit frizione'], price: null, aftermarket: [] },
    ],
  },
  g6: {
    name: ['Timing belt kit', 'Kit distribuzione'],
    words: ['timing', 'belt', 'distribuzione', 'cinghia'],
    unit: { code: 'u6', name: ['Timing drive', 'Distribuzione'], image: true },
    original: [
      {
        code: '71771580',
        name: ['Timing belt kit', 'Kit cinghia distribuzione'],
        price: null,
        aftermarket: [
          ['GATES', 'K015607XS', 'Timing belt kit', null],
          ['CONTITECH', 'CT1028K1', 'Timing belt kit', null],
        ],
      },
    ],
  },
}

const explodedView = (code: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="#fff"/><g fill="none" stroke="#475569" stroke-width="3"><circle cx="120" cy="78" r="34"/><circle cx="120" cy="78" r="12"/><rect x="78" y="136" width="84" height="40" rx="8"/><path d="M120 112v24M58 36l32 20M182 36l-32 20"/></g><text x="120" y="216" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#0f172a">${code}</text></svg>`
  )}`

const user = (person: Person): Searcher => ({
  type: 'user',
  id: Number(person.id),
  name: person.name || person.email,
})

const contact = (id: number, name: string): Searcher => ({ type: 'contact', id, name })

const workshops = {
  oakfield: contact(1, 'Oakfield Garage'),
  baker: contact(2, 'Baker and Sons Motors'),
  hillside: contact(3, 'Hillside Auto Repair'),
  capitol: contact(6, 'Capitol Auto Care'),
  quickFit: contact(5, 'Quick Fit Tyres'),
}

const identified: LookupObjectStatus[] = ['done', 'not_matched']

type Seed = [
  plate: string,
  status: LookupObjectStatus,
  searcher: Searcher,
  nodeIds: string[],
  options?: { gone?: boolean; cached?: boolean },
]

const RECENT: Seed[] = [
  ['GH482KL', 'running', user(people.julia), []],
  ['FT915ZR', 'done', workshops.oakfield, ['g1']],
  ['EX204BB', 'vehicle_not_found', user(people.mark), []],
  ['CA770NE', 'done', user(people.mark), ['g4']],
  ['DK318MP', 'not_matched', workshops.baker, []],
  ['GH482KL', 'failed', user(people.luke), []],
  ['CA770NE', 'done', workshops.hillside, ['g1', 'g2']],
  ['FT915ZR', 'done', workshops.quickFit, ['g6'], { gone: true }],
  ['DK318MP', 'done', workshops.capitol, ['g5'], { cached: false }],
]

const OLDER: Seed[] = [
  ['CA770NE', 'done', workshops.oakfield, ['g2']],
  ['FT915ZR', 'done', user(people.sarah), ['g4']],
  ['ZZ999ZZ', 'vehicle_not_found', workshops.baker, []],
  ['GH482KL', 'done', user(people.julia), ['g6']],
  ['DK318MP', 'done', workshops.oakfield, ['g1']],
]

function seed(): Stored[] {
  const now = new Date()
  const seeds = [...RECENT, ...OLDER, ...OLDER, ...OLDER].reverse()

  return seeds.map(([plate, status, searcher, nodeIds, options], index) => {
    const minutes = (seeds.length - index - 1) ** 2 * 9 + 1

    return {
      id: index + 1,
      company: 'redwood-parts',
      plate,
      vin: identified.includes(status) ? VEHICLES[plate]!.vin : null,
      nodeIds,
      status,
      source: searcher.type === 'contact' ? 'whatsapp' : 'web',
      searcher,
      createdAt: subMinutes(now, minutes).toISOString(),
      cached: options?.cached ?? true,
      gone: options?.gone,
    }
  })
}

function archive<T>(change: (state: Archive) => T): T {
  const saved = sessionStorage.getItem('mock.lookups')
  const state: Archive = saved ? JSON.parse(saved) : { lookups: seed(), nextId: 100 }
  const result = change(state)
  sessionStorage.setItem('mock.lookups', JSON.stringify(state))

  return result
}

const languageOf = (request: Request): Language =>
  request.headers.get('accept-language')?.startsWith('it') ? 1 : 0

function categoriesOf(nodeIds: string[], language: Language) {
  return nodeIds.map((id) => {
    const { name, unit, original } = CATALOG[id]!

    return {
      id,
      name: name[language],
      units: [
        {
          code: unit.code,
          name: unit.name[language],
          imageUrl: unit.image ? explodedView(unit.code) : null,
          original: original.map((part) => ({
            code: part.code,
            name: part.name[language],
            price: part.price,
            aftermarket: part.aftermarket.map(([brand, code, description, price]) => ({
              brand,
              code,
              description,
              price,
            })),
          })),
        },
      ],
    }
  })
}

const stale = ({ status, createdAt }: Stored) =>
  status === 'running' && new Date(createdAt) < subMinutes(new Date(), STALE_MINUTES)

function lookupOf(stored: Stored, language: Language): LookupObject {
  const { company: _company, gone, cached, searcher, ...lookup } = stored
  const status = stale(stored) ? 'failed' : stored.status
  const details = cached && identified.includes(status)

  return {
    ...lookup,
    status,
    searcher: gone ? null : searcher,
    ...(details && { vehicleDescription: VEHICLES[lookup.plate]?.description ?? null }),
    ...(details && status === 'done' && { categories: categoriesOf(lookup.nodeIds, language) }),
  }
}

function checkedPlate(plate: unknown) {
  if (plate === undefined || plate === null || plate === '') return invalid('plate', 'required')
  if (typeof plate !== 'string') return invalid('plate', 'string')

  const compact = plate
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, '')

  return PLATE.test(compact) ? compact : invalid('plate', 'plate')
}

function checkedQuery(query: unknown) {
  if (query === undefined || query === null || query === '') return null
  if (typeof query !== 'string') return invalid('query', 'string')

  const trimmed = query.trim()
  if (trimmed.length < 2) invalid('query', 'minLength')
  if (trimmed.length > 200) invalid('query', 'maxLength')

  return trimmed
}

function checkedNodeIds(nodeIds: unknown) {
  if (nodeIds === undefined) return null
  if (!Array.isArray(nodeIds) || !nodeIds.every((id) => typeof id === 'string' && id.trim())) {
    return invalid('nodeIds', 'array')
  }
  if (nodeIds.length < 1) invalid('nodeIds', 'minLength')
  if (nodeIds.length > MAX_NODES) invalid('nodeIds', 'maxLength')
  if (new Set(nodeIds).size !== nodeIds.length) invalid('nodeIds', 'distinct')

  return nodeIds.map((id: string) => id.trim())
}

function matching(query: string) {
  const text = query.toLowerCase()

  return Object.entries(CATALOG)
    .filter(([, { words }]) => words.some((word) => text.includes(word)))
    .map(([id]) => id)
}

function settled(lookup: Stored, query: string | null): Stored {
  const vehicle = VEHICLES[lookup.plate]
  if (lookup.plate === FAILING_PLATE) return { ...lookup, status: 'failed' }
  if (!vehicle) return { ...lookup, status: 'vehicle_not_found' }

  const nodeIds = query ? matching(query).slice(0, MAX_NODES) : lookup.nodeIds
  const known = nodeIds.every((id) => id in CATALOG)
  const status = nodeIds.length === 0 ? 'not_matched' : known ? 'done' : 'failed'

  return { ...lookup, vin: vehicle.vin, nodeIds, status }
}

const isSearcherType = (value: string): value is SearcherType =>
  Object.values<string>(SearcherType).includes(value)

export const lookupMocks = [
  getGetApiV1WorkspaceLookupsMockHandler(({ request }) => {
    const { company } = member()
    const query = new URL(request.url).searchParams
    const currentPage = Number(query.get('page') ?? 1)
    const perPage = Number(query.get('perPage') ?? DEFAULT_PER_PAGE)
    const searcherType = query.get('searcherType')
    const searcherId = query.has('searcherId') ? Number(query.get('searcherId')) : null
    if (!(currentPage >= 1)) invalid('page', 'min')
    if (!(perPage >= 1 && perPage <= MAX_PER_PAGE)) invalid('perPage', 'range')
    if (searcherType !== null && !isSearcherType(searcherType)) invalid('searcherType', 'enum')
    if (searcherId !== null && !(searcherId > 0)) invalid('searcherId', 'positive')
    if (searcherId !== null && searcherType === null) {
      invalid('searcherType', 'requiredIfExists')
    }

    return archive((state) => {
      const lookups = state.lookups
        .filter((item) => item.company === company)
        .filter(({ searcher }) => searcherType === null || searcher.type === searcherType)
        .filter(({ searcher }) => searcherId === null || searcher.id === searcherId)
        .sort((a, b) => b.id - a.id)
        .map((item) => lookupOf(item, languageOf(request)))

      return page(lookups, currentPage, perPage)
    })
  }),
  getGetApiV1LookupsLookupIdMockHandler(({ request, params }) => {
    const { company } = member()

    return archive((state) => {
      const found = state.lookups.find(
        (item) => item.company === company && item.id === Number(params.lookupId)
      )

      return { data: lookupOf(found ?? fail(404, 'ROW_NOT_FOUND'), languageOf(request)) }
    })
  }),
  getPostApiV1LookupsMockHandler(async ({ request }) => {
    const { company, user: me } = member()
    const body = (await request.json()) as Partial<PostApiV1LookupsBody>
    const plate = checkedPlate(body.plate)
    const nodeIds = checkedNodeIds(body.nodeIds)
    const query = checkedQuery(body.query)
    if (nodeIds === null && query === null) invalid('nodeIds', 'requiredIfMissing')
    if (nodeIds !== null && query !== null) invalid('query', 'prohibitedWith')

    return archive((state) => {
      const running: Stored = {
        id: state.nextId++,
        company,
        plate,
        vin: null,
        nodeIds: nodeIds ?? [],
        status: 'running',
        source: 'web',
        searcher: user(me),
        createdAt: new Date().toISOString(),
        cached: true,
      }
      state.lookups.push(settled(running, query))

      return { data: lookupOf(running, languageOf(request)) }
    })
  }),
]
