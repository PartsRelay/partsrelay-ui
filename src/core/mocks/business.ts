import { http, HttpResponse } from 'msw'
import type { ContactObject, LookupObject } from '@/core/api/models'
import { signedInAs } from '@/core/mocks/data'
import { searchFormSchema } from '@/modules/searches/core/search'

// Explicit design preview only. These records never reach the live API.
const createdAt = new Date().toISOString()
const categories = [
  {
    id: 'brakes',
    name: 'Front brake pads',
    units: [
      {
        code: '33101',
        name: 'Front brake assembly',
        imageUrl: null,
        original: [
          {
            code: '77367141',
            name: 'Front brake pad set',
            price: null,
            aftermarket: [
              { code: 'P 23 111', brand: 'Brembo', description: 'Brake pad set', price: null },
              { code: '0 986 494 734', brand: 'Bosch', description: 'Brake pad set', price: null },
            ],
          },
        ],
      },
    ],
  },
]
let lookups: LookupObject[] = Array.from({ length: 24 }, (_, index) => ({
  id: 24 - index,
  plate: ['EF123GH', 'AB456CD', 'FG789LM', 'CD321EF'][index % 4],
  vin: null,
  nodeIds: ['brakes'],
  status:
    index === 2
      ? 'failed'
      : index === 4
        ? 'vehicle_not_found'
        : index === 6
          ? 'not_matched'
          : 'done',
  source: index % 3 === 0 ? 'whatsapp' : 'web',
  searcher:
    index % 3 === 0
      ? { type: 'contact', id: 1, name: 'Officina Rossi' }
      : { type: 'user', id: 1, name: 'Mark Reed' },
  vehicleDescription: index === 4 ? null : 'Fiat Panda 1.2',
  categories: [2, 4, 6, 8].includes(index) ? [] : categories,
  createdAt: new Date(Date.now() - index * 36e5).toISOString(),
}))
let contacts: ContactObject[] = [
  {
    id: 1,
    waId: '393331234567',
    name: 'Officina Rossi',
    profileName: 'Marco Rossi',
    status: 'active',
    createdAt,
    lookupsCount: 18,
    monthLookupsCount: 8,
    lastLookupAt: createdAt,
  },
  {
    id: 2,
    waId: '393339876543',
    name: 'Garage Bianchi',
    profileName: 'Luca Bianchi',
    status: 'active',
    createdAt,
    lookupsCount: 12,
    monthLookupsCount: 4,
    lastLookupAt: createdAt,
  },
  {
    id: 3,
    waId: '393335554444',
    name: 'Auto Service Verdi',
    profileName: 'Paolo Verdi',
    status: 'blocked',
    createdAt,
    lookupsCount: 3,
    monthLookupsCount: 1,
    lastLookupAt: createdAt,
  },
]
const fail = (status: number, code: string) => HttpResponse.json({ status, code }, { status })
function page<T>(data: T[], url: URL) {
  const currentPage = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get('perPage')) || 20))
  const lastPage = Math.max(1, Math.ceil(data.length / perPage))
  return HttpResponse.json({
    data: data.slice((currentPage - 1) * perPage, currentPage * perPage),
    metadata: {
      total: data.length,
      perPage,
      firstPage: 1,
      firstPageUrl: null,
      currentPage,
      lastPage,
      lastPageUrl: null,
      previousPageUrl: null,
      nextPageUrl: null,
    },
  })
}
export const businessMocks = [
  http.get('*/api/v1/workspace/lookups', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('searcherType')
    const id = url.searchParams.get('searcherId')
    return page(
      lookups.filter(
        (row) => (!type || row.searcher?.type === type) && (!id || String(row.searcher?.id) === id)
      ),
      url
    )
  }),
  http.get('*/api/v1/lookups/:id', ({ params }) => {
    const lookup = lookups.find((row) => String(row.id) === params.id)
    return lookup ? HttpResponse.json({ data: lookup }) : fail(404, 'LOOKUP_NOT_FOUND')
  }),
  http.post('*/api/v1/lookups', async ({ request }) => {
    const parsed = searchFormSchema.safeParse(await request.json())
    if (!parsed.success) return fail(422, 'VALIDATION_FAILURE')
    const me = signedInAs()
    const lookup: LookupObject = {
      id: Math.max(...lookups.map((row) => row.id), 0) + 1,
      plate: parsed.data.plate,
      vin: null,
      nodeIds: [],
      status: 'running',
      source: 'web',
      searcher: { type: 'user', id: Number(me.id), name: me.name },
      createdAt: new Date().toISOString(),
    }
    lookups = [lookup, ...lookups]
    setTimeout(() => {
      lookup.status = 'done'
      lookup.vehicleDescription = 'Fiat Panda 1.2'
      lookup.categories = categories
    }, 1800)
    return HttpResponse.json({ data: lookup }, { status: 202 })
  }),
  http.get('*/api/v1/workspace/contacts', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status[]') || url.searchParams.get('status')
    return page(
      contacts.filter((row) => !status || row.status === status),
      url
    )
  }),
  http.post('*/api/v1/workspace/contacts', async ({ request }) => {
    const data = (await request.json()) as { phone: string; name?: string }
    const waId = data.phone.replace(/\D/g, '')
    if (contacts.some((row) => row.waId === waId)) return fail(422, 'VALIDATION_ERROR')
    const contact: ContactObject = {
      id: Math.max(...contacts.map((row) => row.id), 0) + 1,
      waId,
      name: data.name || null,
      profileName: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      lookupsCount: 0,
      monthLookupsCount: 0,
      lastLookupAt: null,
    }
    contacts.push(contact)
    return HttpResponse.json({ data: contact }, { status: 201 })
  }),
  http.patch('*/api/v1/workspace/contacts/:id', async ({ request, params }) => {
    const contact = contacts.find((row) => String(row.id) === params.id)
    if (!contact) return fail(404, 'CONTACT_NOT_FOUND')
    const data = (await request.json()) as { name?: string | null; status?: 'active' | 'blocked' }
    if (data.name !== undefined) contact.name = data.name
    if (data.status !== undefined) contact.status = data.status
    return HttpResponse.json({ data: contact })
  }),
  http.delete('*/api/v1/workspace/contacts/:id', ({ params }) => {
    contacts = contacts.filter((row) => String(row.id) !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
  // A preview must never fall through to provider-backed API requests.
  http.all('*/api/*', () => fail(501, 'PREVIEW_ENDPOINT_UNAVAILABLE')),
]
