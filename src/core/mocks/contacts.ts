import { http, HttpResponse } from 'msw'
import {
  getGetApiV1WorkspaceContactsMockHandler,
  getPatchApiV1WorkspaceContactsContactIdMockHandler,
  getPostApiV1WorkspaceContactsMockHandler,
} from '@/core/api/endpoints/contacts/contacts.msw'
import {
  type ContactObject,
  ContactObjectStatus,
  type GetApiV1WorkspaceContacts200,
  type PatchApiV1WorkspaceContactsContactIdBody,
  type PostApiV1WorkspaceContactsBody,
} from '@/core/api/models'
import { member } from '@/core/mocks/auth'
import { checkedPage, daysAgo, page } from '@/core/mocks/data'
import { capStrings, fail, rejected } from '@/core/mocks/errors'
import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '@/core/pagination'

// Contacts of each company, by company slug
type Directory = { companies: Record<string, ContactObject[]>; nextId: number }

type Searches = [total: number, month: number, lastDaysAgo: number | null]

const INTERNATIONAL = /^\+[1-9]\d{7,14}$/

const contact = (
  id: number,
  waId: string,
  name: string | null,
  profileName: string | null,
  status: ContactObject['status'] = 'active',
  [total, month, last]: Searches = [0, 0, null]
): ContactObject => ({
  id,
  waId,
  name,
  profileName,
  status,
  createdAt: daysAgo(400 - id * 7),
  lookupsCount: total,
  monthLookupsCount: month,
  lastLookupAt: last === null ? null : daysAgo(last),
})

// Workshop and WhatsApp profile names
const MORE_WORKSHOPS = [
  ['Riverside Motors', 'Liam Carter'],
  ['Elm Street Garage', 'Olivia Hughes'],
  ['Northgate Auto', 'Noah Price'],
  ['Brookside Tyres', 'Emma Wood'],
  ['Kingsway Service Centre', 'Jack Turner'],
  ['Westfield Car Care', 'Grace Hall'],
  ['Parkview Motors', 'Harry Green'],
  ['Station Road Garage', 'Lily Adams'],
  ['Highfield Auto Electrics', 'George King'],
  ['Millbrook Garage', 'Amelia Wright'],
  ['Greenway Motors', 'Oscar Scott'],
  ['Ashford Auto Repairs', 'Mia Baker'],
  ['Bridge End Garage', 'Charlie Hill'],
  ['Valley Tyres', 'Ella Moore'],
  ['Castle Motors', 'Jacob Clark'],
  ['Meadow Lane Garage', 'Ruby Lewis'],
  ['Harbour Auto Centre', 'Thomas Young'],
  ['Fairview Motors', 'Sophie Allen'],
] as const

// Enough Redwood Parts contacts for two pages
function seed(): Directory['companies'] {
  return {
    'redwood-parts': [
      contact(1, '447700900101', 'Oakfield Garage', 'Tom Walker', 'active', [412, 38, 0]),
      contact(2, '447700900102', 'Baker and Sons Motors', 'Dan Baker', 'active', [96, 12, 1]),
      contact(3, '447700900103', null, 'Hillside Auto Repair', 'active', [41, 3, 4]),
      contact(4, '447700900104', null, null, 'active', [2, 0, 40]),
      contact(5, '447700900105', 'Quick Fit Tyres', 'Sam', 'blocked', [17, 0, 60]),
      contact(6, '12025550106', 'Capitol Auto Care', 'Mike Jones', 'active', [8, 2, 2]),
      ...MORE_WORKSHOPS.map(([name, profileName], index) =>
        contact(
          7 + index,
          `447700900${110 + index}`,
          index % 3 === 0 ? null : name,
          index % 3 === 1 ? null : profileName,
          index % 7 === 6 ? 'blocked' : 'active',
          index % 4 === 0 ? [0, 0, null] : [index * 5, index % 5, index]
        )
      ),
    ],
    'ironworks-garage': [contact(40, '447700900201', 'Ironworks Fleet Desk', null)],
  }
}

// Kept in sessionStorage like the auth mocks
function directory<T>(change: (state: Directory) => T): T {
  const saved = sessionStorage.getItem('mock.contacts')
  const state: Directory = saved ? JSON.parse(saved) : { companies: seed(), nextId: 100 }
  const result = change(state)
  sessionStorage.setItem('mock.contacts', JSON.stringify(state))

  return result
}

// Same rule as the contact policy of the core
function authorize(role: string | undefined) {
  if (role === 'viewer') fail(403, 'authorization-failure', 'Access denied')
}

const isStatus = (value: unknown): value is ContactObject['status'] =>
  Object.values<unknown>(ContactObjectStatus).includes(value)

const contactsOf = (state: Directory, company: string) => (state.companies[company] ??= [])

// Same normalisation as the core validator
function toWaId(phone: unknown) {
  if (phone === undefined || phone === null || phone === '') return rejected('phone', 'required')
  if (typeof phone !== 'string') return rejected('phone', 'string')

  const international = phone
    .replace(/\(0\)/g, '')
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+')

  return INTERNATIONAL.test(international) ? international.slice(1) : rejected('phone', 'waId')
}

function checkedName(name: unknown) {
  if (name === undefined || name === null) return null
  if (typeof name !== 'string') return rejected('name', 'string')

  return name.trim() || null
}

function found(state: Directory, company: string, id: string) {
  return (
    contactsOf(state, company).find((item) => item.id === Number(id)) ??
    fail(404, 'row-not-found', 'Row not found')
  )
}

export const contactMocks = [
  getGetApiV1WorkspaceContactsMockHandler(async ({ request }) => {
    await capStrings(request)
    const { company } = member()
    const query = new URL(request.url).searchParams
    // The core reads status[], like axios sends it
    const statuses = query.getAll('status[]')
    if (query.has('status')) rejected('status', 'array')
    for (const [index, status] of statuses.entries()) {
      if (!isStatus(status)) rejected(`status.${index}`, 'enum')
    }
    const currentPage = checkedPage(query, 'page', 1)
    const perPage = checkedPage(query, 'perPage', DEFAULT_PER_PAGE, MAX_PER_PAGE)

    return directory((state) => {
      const matching = contactsOf(state, company)
        .filter((item) => statuses.length === 0 || statuses.includes(item.status))
        .sort((a, b) => b.id - a.id)

      return page(matching, currentPage, perPage) satisfies GetApiV1WorkspaceContacts200
    })
  }),
  getPostApiV1WorkspaceContactsMockHandler(async ({ request }) => {
    await capStrings(request)
    const { company, role } = member()
    authorize(role)
    const body = (await request.json()) as Partial<PostApiV1WorkspaceContactsBody>
    const waId = toWaId(body.phone)
    const name = checkedName(body.name)

    return directory((state) => {
      const taken = Object.values(state.companies).some((items) =>
        items.some((item) => item.waId === waId)
      )
      if (taken) rejected('phone', 'database.unique')

      const created = { ...contact(state.nextId++, waId, name, null), createdAt: daysAgo(0) }
      contactsOf(state, company).push(created)

      return { data: created }
    })
  }),
  getPatchApiV1WorkspaceContactsContactIdMockHandler(async ({ request, params }) => {
    await capStrings(request)
    const { company, role } = member()
    const body = (await request.json()) as PatchApiV1WorkspaceContactsContactIdBody

    // Not found, then forbidden, then invalid, like the core
    return directory((state) => {
      const target = found(state, company, String(params.contactId))
      authorize(role)
      const name = body.name === undefined ? undefined : checkedName(body.name)
      if (body.status !== undefined && !isStatus(body.status)) rejected('status', 'enum')

      if (name !== undefined) target.name = name
      if (body.status !== undefined) target.status = body.status

      return { data: target }
    })
  }),
  // The generated handler answers 200, the core 204
  http.delete('*/api/v1/workspace/contacts/:contactId', ({ params }) => {
    const { company, role } = member()

    directory((state) => {
      const items = contactsOf(state, company)
      const target = found(state, company, String(params.contactId))
      authorize(role)
      items.splice(items.indexOf(target), 1)
    })

    return new HttpResponse(null, { status: 204 })
  }),
]
