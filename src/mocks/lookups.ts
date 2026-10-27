import { subDays, subMinutes } from 'date-fns'
import {
  getGetApiV1LookupsLookupIdMockHandler,
  getPostApiV1LookupsMockHandler,
} from '@/core/api/endpoints/lookups/lookups.msw'
import {
  getGetApiV1WorkspaceLookupsMockHandler,
  getGetApiV1WorkspaceLookupsStatsMockHandler,
} from '@/core/api/endpoints/workspace-lookups/workspace-lookups.msw'
import {
  type LookupObject,
  LookupObjectSource,
  LookupObjectStatus,
  type PostApiV1LookupsBody,
  type Searcher,
  SearcherType,
  type TopSearcher,
} from '@/core/api/models'
import { member } from '@/mocks/auth'
import { checkedPage, page, people, type Person } from '@/mocks/data'
import { apiBody, fail, invalid, rejected } from '@/mocks/errors'
import explodedView from '@/mocks/exploded-view.svg?no-inline'
import { DEFAULT_PER_PAGE } from '@/core/pagination'

type Text = [en: string, it: string]

type Language = 0 | 1

type Match = [brand: string, code: string, description: string]

type Unit = {
  code: string
  name: Text
  image: boolean
  original: { code: string; name: Text; position: string | null; aftermarket: Match[] }[]
}

type Category = { name: Text; words: string[]; units: Unit[] }

type Stored = Omit<LookupObject, 'searcher' | 'vehicleDescription' | 'categories'> & {
  company: string
  searcher: Searcher
  gone?: boolean
  cached: boolean
}

type Archive = { lookups: Stored[]; nextId: number }

const PLATE = /^[A-Z0-9]{4,8}$/
const VIN = /^[A-HJ-NPR-Z0-9]{17}$/
const STALE_MINUTES = 15
const STATS_DAYS = 30
const TOP_SEARCHERS = 5
const FAILED: LookupObjectStatus[] = ['failed', 'vehicle_not_found', 'not_matched']
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
    units: [
      {
        code: '10106',
        name: ['Oil filter and supports', 'Filtro olio e supporti'],
        image: true,
        original: [
          {
            code: '55256470',
            name: ['Oil filter', 'Filtro olio'],
            position: '3',
            aftermarket: [
              ['MANN-FILTER', 'W 712/95', 'Oil filter'],
              ['BOSCH', 'F 026 407 209', 'Oil filter'],
              ['UFI', '23.123.00', 'Oil filter'],
            ],
          },
        ],
      },
    ],
  },
  g2: {
    name: ['Air filter', 'Filtro aria'],
    words: ['air', 'aria'],
    units: [
      {
        code: '10420',
        name: ['Air cleaner', 'Depuratore aria'],
        image: true,
        original: [
          {
            code: '51854724',
            name: ['Air filter', 'Filtro aria'],
            position: '3',
            aftermarket: [
              ['MANN-FILTER', 'C 2433/2', 'Air filter'],
              ['MAHLE', 'LX 2826', 'Air filter'],
            ],
          },
        ],
      },
    ],
  },
  g3: {
    name: ['Cabin filter', 'Filtro abitacolo'],
    words: ['cabin', 'pollen', 'abitacolo', 'polline'],
    units: [],
  },
  g4: {
    name: ['Front brake pads', 'Pastiglie freno anteriori'],
    words: ['brake', 'pad', 'freno', 'freni', 'pastiglie'],
    units: [
      {
        code: '50110',
        name: ['Front brakes', 'Freni anteriori'],
        image: true,
        original: [
          {
            code: '77367141',
            name: ['Front brake pad set', 'Kit pastiglie freno anteriori'],
            position: '4',
            aftermarket: [
              ['BREMBO', 'P 23 141', 'Brake pad set, disc brake'],
              ['TRW', 'GDB1891', 'Brake pad set, disc brake'],
              ['BOSCH', '0 986 494 597', 'Brake pad set, disc brake'],
            ],
          },
        ],
      },
      {
        code: '50112',
        name: ['Front brake caliper', 'Pinza freno anteriore'],
        image: true,
        original: [
          {
            code: '77365620',
            name: ['Brake pad fitting kit', 'Kit accessori pastiglie'],
            position: '6',
            aftermarket: [['TRW', 'PFK543', 'Accessory kit, disc brake pads']],
          },
          {
            code: '46402682',
            name: ['Pad retaining spring', 'Molla fermo pastiglie'],
            position: '7',
            aftermarket: [],
          },
        ],
      },
    ],
  },
  g5: {
    name: ['Clutch kit', 'Kit frizione'],
    words: ['clutch', 'frizione'],
    units: [
      {
        code: '18010',
        name: ['Clutch', 'Frizione'],
        image: false,
        original: [
          {
            code: '55238862',
            name: ['Clutch kit', 'Kit frizione'],
            position: null,
            aftermarket: [],
          },
        ],
      },
    ],
  },
  g6: {
    name: ['Timing belt kit', 'Kit distribuzione'],
    words: ['timing', 'belt', 'distribuzione', 'cinghia'],
    units: [
      {
        code: '10132',
        name: ['Timing drive', 'Comando distribuzione'],
        image: true,
        original: [
          {
            code: '71771580',
            name: ['Timing belt kit', 'Kit cinghia distribuzione'],
            position: '1',
            aftermarket: [
              ['GATES', 'K015607XS', 'Timing belt kit'],
              ['CONTITECH', 'CT1028K1', 'Timing belt kit'],
            ],
          },
        ],
      },
    ],
  },
}

function imageOf(size: string) {
  const url = new URL(explodedView, window.location.origin)
  url.searchParams.set('size', size)

  return url.href
}

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
  identifier: string,
  status: LookupObjectStatus,
  searcher: Searcher,
  nodeIds: string[],
  query: string,
  options?: { gone?: boolean; cached?: boolean },
]

const RECENT: Seed[] = [
  ['GH482KL', 'running', user(people.julia), [], 'Front brake pads'],
  ['FT915ZR', 'done', workshops.oakfield, ['g1'], 'Oil filter'],
  ['EX204BB', 'vehicle_not_found', user(people.mark), [], 'Clutch kit'],
  ['CA770NE', 'done', user(people.mark), ['g4'], 'Front brake pads'],
  ['DK318MP', 'not_matched', workshops.baker, [], 'Wiper blades'],
  ['GH482KL', 'failed', user(people.luke), [], 'Timing belt kit'],
  ['CA770NE', 'done', workshops.hillside, ['g1', 'g2'], 'Oil and air filters'],
  ['FT915ZR', 'done', workshops.quickFit, ['g6'], 'Timing belt kit', { gone: true }],
  ['DK318MP', 'done', workshops.capitol, ['g5'], 'Clutch kit', { cached: false }],
]

const OLDER: Seed[] = [
  ['CA770NE', 'done', workshops.oakfield, ['g2'], 'Air filter'],
  ['WVWZZZAUZHW204411', 'done', user(people.sarah), ['g4'], 'Front brake pads'],
  ['ZZ999ZZ', 'vehicle_not_found', workshops.baker, [], 'Oil filter'],
  ['GH482KL', 'done', user(people.julia), ['g6'], 'Timing belt kit'],
  ['DK318MP', 'done', workshops.oakfield, ['g1'], 'Oil filter'],
]

const vehicleOf = ({ plate, vin }: Pick<LookupObject, 'plate' | 'vin'>) =>
  (plate && VEHICLES[plate]) || Object.values(VEHICLES).find((vehicle) => vehicle.vin === vin)

function seed(): Stored[] {
  const now = new Date()
  const seeds = [...RECENT, ...OLDER, ...OLDER, ...OLDER].reverse()

  return seeds.map(([identifier, status, searcher, nodeIds, query, options], index) => {
    const minutes = (seeds.length - index - 1) ** 2 * 136 + 1
    const plate = VIN.test(identifier) ? null : identifier
    const vin =
      plate === null ? identifier : identified.includes(status) ? VEHICLES[plate]!.vin : null

    return {
      id: index + 1,
      company: 'redwood-parts',
      plate,
      vin,
      query,
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
    const { name, units } = CATALOG[id]!

    return {
      id,
      name: name[language],
      units: units.map((unit) => ({
        code: unit.code,
        name: unit.name[language],
        imageUrl: unit.image ? imageOf('source') : null,
        thumbnailUrl: unit.image ? imageOf('250') : null,
        original: unit.original.map((part) => ({
          code: part.code,
          name: part.name[language],
          position: part.position,
          aftermarket: part.aftermarket.map(([brand, code, description]) => ({
            brand,
            code,
            description,
          })),
        })),
      })),
    }
  })
}

const stale = ({ status, createdAt }: Stored) =>
  status === 'running' && new Date(createdAt) < subMinutes(new Date(), STALE_MINUTES)

const statusOf = (stored: Stored) => (stale(stored) ? 'failed' : stored.status)

function lookupOf(stored: Stored, language: Language): LookupObject {
  const { company: _company, gone, cached, searcher, ...lookup } = stored
  const status = statusOf(stored)
  const details = cached && identified.includes(status)

  return {
    ...lookup,
    status,
    searcher: gone ? null : searcher,
    ...(details && { vehicleDescription: vehicleOf(lookup)?.description ?? null }),
    ...(details && status === 'done' && { categories: categoriesOf(lookup.nodeIds, language) }),
  }
}

function checkedPlate(plate: unknown) {
  if (plate === undefined || plate === null) return null
  if (typeof plate !== 'string') return rejected('plate', 'string')

  const compact = plate.toUpperCase().replace(/[\s.-]/g, '')

  return PLATE.test(compact) ? compact : rejected('plate', 'plate')
}

function checkedVin(vin: unknown) {
  if (vin === undefined || vin === null) return null
  if (typeof vin !== 'string') return rejected('vin', 'string')

  return VIN.test(vin.toUpperCase()) ? vin.toUpperCase() : rejected('vin', 'regex')
}

function checkedQuery(query: unknown) {
  if (query === undefined || query === null || query === '') return rejected('query', 'required')
  if (typeof query !== 'string') return rejected('query', 'string')

  const trimmed = query.trim()
  if (trimmed.length < 2) rejected('query', 'minLength')

  return trimmed
}

function checkedSearcherId(query: URLSearchParams) {
  if (!query.has('searcherId')) return null

  const value = Number(query.get('searcherId'))
  if (Number.isNaN(value)) rejected('searcherId', 'number')
  if (value <= 0) rejected('searcherId', 'positive')

  return value
}

function matching(query: string) {
  const text = query.toLowerCase()

  return Object.entries(CATALOG)
    .filter(([, { words }]) => words.some((word) => text.includes(word)))
    .map(([id]) => id)
}

function settled(lookup: Stored): Stored {
  const vehicle = vehicleOf(lookup)
  if (lookup.plate === FAILING_PLATE) return { ...lookup, status: 'failed' }
  if (!vehicle) return { ...lookup, status: 'vehicle_not_found' }

  const nodeIds = matching(lookup.query ?? '')
  const status = nodeIds.length === 0 ? 'not_matched' : 'done'

  return { ...lookup, vin: vehicle.vin, nodeIds, status }
}

function checkedEnum<T extends string>(query: URLSearchParams, name: string, values: T[]) {
  const value = query.get(name)
  if (value === null) return null

  return values.find((item) => item === value) ?? rejected(name, 'enum')
}

function contains(values: (string | null)[], search: string | null) {
  return !search || values.some((value) => value?.toLowerCase().includes(search.toLowerCase()))
}

function topSearchers(lookups: Stored[]) {
  const counts = new Map<string, TopSearcher>()

  for (const { searcher, gone } of lookups) {
    const key = `${searcher.type}:${searcher.id}`
    const top = counts.get(key) ?? { searcher: gone ? null : searcher, total: 0 }
    counts.set(key, { ...top, total: top.total + 1 })
  }

  return [...counts.values()].sort((a, b) => b.total - a.total).slice(0, TOP_SEARCHERS)
}

const isSearcherType = (value: string): value is SearcherType =>
  Object.values<string>(SearcherType).includes(value)

export const lookupMocks = [
  getGetApiV1WorkspaceLookupsMockHandler(async ({ request }) => {
    const { company } = member()
    const query = new URL(request.url).searchParams
    const currentPage = checkedPage(query, 'page', 1)
    const perPage = checkedPage(query, 'perPage', DEFAULT_PER_PAGE)
    const searcherType = query.get('searcherType')
    if (searcherType !== null && !isSearcherType(searcherType)) rejected('searcherType', 'enum')
    if (searcherType === null && query.has('searcherId')) rejected('searcherType', 'required')
    const searcherId = checkedSearcherId(query)
    const search = query.get('search')?.trim() || null
    const status = checkedEnum(query, 'status', Object.values(LookupObjectStatus))
    const source = checkedEnum(query, 'source', Object.values(LookupObjectSource))
    const since = query.has('days') ? subDays(new Date(), checkedPage(query, 'days', 1)) : null

    return archive((state) => {
      const lookups = state.lookups
        .filter((item) => item.company === company)
        .filter(({ searcher }) => searcherType === null || searcher.type === searcherType)
        .filter(({ searcher }) => searcherId === null || searcher.id === searcherId)
        .sort((a, b) => b.id - a.id)
        .map((item) => lookupOf(item, languageOf(request)))
        .filter((item) => contains([item.plate, item.vin], search))
        .filter((item) => status === null || item.status === status)
        .filter((item) => source === null || item.source === source)
        .filter((item) => since === null || new Date(item.createdAt) >= since)

      return page(lookups, currentPage, perPage)
    })
  }),
  getGetApiV1LookupsLookupIdMockHandler(async ({ request, params }) => {
    const { company } = member()

    return archive((state) => {
      const found = state.lookups.find(
        (item) => item.company === company && item.id === Number(params.lookupId)
      )

      return {
        data: lookupOf(found ?? fail(404, 'row-not-found', 'Row not found'), languageOf(request)),
      }
    })
  }),
  getPostApiV1LookupsMockHandler(async ({ request }) => {
    const body = await apiBody<PostApiV1LookupsBody>(request)
    const { company, user: me } = member()
    const plate = checkedPlate(body.plate)
    const vin = checkedVin(body.vin)
    if (!plate && !vin) {
      invalid([
        { field: 'plate', rule: 'required' },
        { field: 'vin', rule: 'required' },
      ])
    }
    const query = checkedQuery(body.query)

    return archive((state) => {
      const running: Stored = {
        id: state.nextId++,
        company,
        plate,
        vin,
        query,
        nodeIds: [],
        status: 'running',
        source: 'web',
        searcher: user(me),
        createdAt: new Date().toISOString(),
        cached: true,
      }
      state.lookups.push(settled(running))

      return { data: lookupOf(running, languageOf(request)) }
    })
  }),
  getGetApiV1WorkspaceLookupsStatsMockHandler(async ({ request }) => {
    const { company, role } = member()
    if (role !== 'owner') fail(403, 'authorization-failure', 'Access denied')
    const days = checkedPage(new URL(request.url).searchParams, 'days', STATS_DAYS)
    const since = subDays(new Date(), days)
    const before = subDays(since, days)

    return archive((state) => {
      const lookups = state.lookups.filter((item) => item.company === company)
      const after = (date: Date) => lookups.filter((item) => new Date(item.createdAt) >= date)
      const current = after(since)
      const count = (statuses: LookupObjectStatus[]) =>
        current.filter((item) => statuses.includes(statusOf(item))).length

      return {
        data: {
          days,
          total: current.length,
          done: count(['done']),
          failed: count(FAILED),
          previousTotal: after(before).length - current.length,
          topSearchers: topSearchers(current),
        },
      }
    })
  }),
]
