import { http, HttpResponse } from 'msw'
import type {
  ContactObject,
  GetApiV1WorkspaceContacts200Metadata,
  PatchApiV1WorkspaceContactsContactIdBody,
  PostApiV1WorkspaceContactsBody,
} from '@/core/api/models'
import { company } from '@/ui/mocks/auth'
import { ago, DAY, me, mockSession } from '@/ui/mocks/data'

type Locale = 'en' | 'it'
type Detail = { field: string; rule: string; message: string; meta?: Record<string, unknown> }

const texts = {
  en: {
    VALIDATION_ERROR: 'Request payload failed validation',
    ROW_NOT_FOUND: 'The requested resource does not exist',
    UNAUTHORIZED_ACCESS: 'Sign in to continue',
    AUTHORIZATION_FAILURE: 'You are not allowed to do this',
    fields: {
      phone: 'phone number',
      name: 'name',
      status: 'status',
      page: 'page',
      perPage: 'perPage',
    },
    required: 'The {field} field is required',
    string: 'The {field} field must be a string',
    array: 'The {field} field must be a list',
    enum: 'The selected {field} is invalid',
    minLength: 'The {field} field must have at least 1 characters',
    maxLength: 'The {field} field must not have more than 255 characters',
    min: 'The {field} field must be at least 1',
    max: 'The {field} field must not be greater than 100',
    waId: 'The {field} field must start with the international prefix, for example +39',
    unique: 'The {field} is already in use',
  },
  it: {
    VALIDATION_ERROR: 'La richiesta contiene dati non validi',
    ROW_NOT_FOUND: 'La risorsa richiesta non esiste',
    UNAUTHORIZED_ACCESS: 'Accedi per continuare',
    AUTHORIZATION_FAILURE: 'Non hai i permessi per questa operazione',
    fields: {
      phone: 'numero di telefono',
      name: 'nome',
      status: 'stato',
      page: 'page',
      perPage: 'perPage',
    },
    required: 'Il campo {field} è obbligatorio',
    string: 'Il campo {field} deve essere un testo',
    array: 'Il campo {field} deve essere un elenco',
    enum: 'Il valore di {field} non è valido',
    minLength: 'Il campo {field} deve avere almeno 1 caratteri',
    maxLength: 'Il campo {field} non può avere più di 255 caratteri',
    min: 'Il campo {field} deve essere almeno 1',
    max: 'Il campo {field} non può superare 100',
    waId: 'Il campo {field} deve iniziare con il prefisso internazionale, ad esempio +39',
    unique: 'Il {field} è già in uso',
  },
}

type Rule = Exclude<keyof (typeof texts)['en'], 'fields' | Code>
type Code = 'VALIDATION_ERROR' | 'ROW_NOT_FOUND' | 'UNAUTHORIZED_ACCESS' | 'AUTHORIZATION_FAILURE'
type Field = keyof (typeof texts)['en']['fields']

const STATUSES = ['active', 'blocked']
const INTERNATIONAL = /^\+[1-9]\d{7,14}$/

const contact = (
  id: number,
  waId: string,
  name: string | null,
  profileName: string | null,
  status: ContactObject['status'],
  searches: [number, number, number | null] = [0, 0, null]
): ContactObject => ({
  id,
  waId,
  name,
  profileName,
  status,
  createdAt: ago((400 - id * 7) * DAY),
  lookupsCount: searches[0],
  monthLookupsCount: searches[1],
  lastLookupAt: searches[2] === null ? null : ago(searches[2] * DAY),
})

const directories = new Map<string, ContactObject[]>([
  [
    '1',
    [
      contact(1, '390287341190', 'Officina Verdi', 'Paolo Verdi', 'active', [412, 38, 0.2]),
      contact(2, '393335550126', 'Carrozzeria Neri', 'Giovanni Neri', 'active', [96, 12, 1]),
      contact(3, '393471234567', null, 'Autofficina Russo', 'active', [41, 3, 4]),
      contact(4, '393289876543', null, null, 'active', [2, 0, 40]),
      contact(5, '393403344556', 'Gommista Bruno', 'Bruno', 'blocked', [17, 0, 60]),
      contact(6, '4915112345678', 'Werkstatt Müller', 'Hans Müller', 'active', [8, 2, 2]),
      ...[
        'Officina Gallo',
        'Elettrauto Conti',
        'Officina De Luca',
        'Autoriparazioni Costa',
        'Officina Fontana',
        'Carrozzeria Rizzi',
        'Officina Moretti',
        'Autofficina Barbieri',
        'Officina Lombardi',
        'Gommista Marino',
        'Officina Greco',
        'Elettrauto Ferrara',
        'Officina Santoro',
        'Carrozzeria Mariani',
        'Officina Rinaldi',
        'Autofficina Caruso',
        'Officina Ferri',
        'Officina Galli',
      ].map((name, index) =>
        contact(
          7 + index,
          `39331${String(10_000_000 + index * 7919).slice(1)}`,
          index % 3 === 0 ? null : name,
          index % 3 === 1 ? null : name.replace(/^\S+ /, ''),
          index % 7 === 6 ? 'blocked' : 'active',
          index % 4 === 0 ? [0, 0, null] : [index * 5, index % 5, index]
        )
      ),
    ],
  ],
  ['3', [contact(40, '393208765432', 'Officina Ferri Due', null, 'active')]],
])

let nextId = 100

const contactsOf = (organizationId: string) => {
  if (!directories.has(organizationId)) directories.set(organizationId, [])

  return directories.get(organizationId)!
}

const locale = (): Locale => (company().organization.locale === 'it' ? 'it' : 'en')

const failure = (status: number, code: Code, details?: Detail[], language = locale()) =>
  HttpResponse.json(
    { error: { code, status, message: texts[language][code], ...(details && { details }) } },
    { status }
  )

const invalid = (field: Field, rule: Rule, coreRule: string = rule) => {
  const text = texts[locale()]

  return { field, rule: coreRule, message: text[rule].replace('{field}', text.fields[field]) }
}

const unauthorized = () =>
  mockSession.active() ? null : failure(401, 'UNAUTHORIZED_ACCESS', undefined, 'en')

const mine = () => contactsOf(company().organization.id)

const manager = () => company().members.find(({ userId }) => userId === me().id)?.role !== 'viewer'

const find = (id: string) => mine().find((item) => item.id === Number(id))

// Same normalisation as the core validator
const toWaId = (phone: string) => {
  const international = phone
    .replace(/\(0\)/g, '')
    .replace(/[\s().-]/g, '')
    .replace(/^00/, '+')

  return INTERNATIONAL.test(international) ? international.slice(1) : null
}

const taken = (waId: string) =>
  [...directories.values()].some((list) => list.some((item) => item.waId === waId))

// Empty strings arrive as null, like the core body parser
const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

function checkName(name: unknown, details: Detail[]) {
  if (name === undefined || name === null) return name
  if (typeof name !== 'string') return void details.push(invalid('name', 'string'))
  if (name.trim().length > 255) return void details.push(invalid('name', 'maxLength'))

  return name.trim()
}

function page(items: ContactObject[], query: URLSearchParams) {
  const details: Detail[] = []
  const currentPage = Number(query.get('page') ?? 1)
  const perPage = Number(query.get('perPage') ?? 20)
  if (!(currentPage >= 1)) details.push(invalid('page', 'min'))
  if (!(perPage >= 1)) details.push(invalid('perPage', 'min'))
  if (perPage > 100) details.push(invalid('perPage', 'max'))
  if (details.length) return failure(422, 'VALIDATION_ERROR', details)

  const lastPage = Math.max(1, Math.ceil(items.length / perPage))
  const link = (target: number) => `/?page=${target}`
  const metadata: GetApiV1WorkspaceContacts200Metadata = {
    total: items.length,
    perPage,
    currentPage,
    lastPage,
    firstPage: 1,
    firstPageUrl: link(1),
    lastPageUrl: link(lastPage),
    nextPageUrl: currentPage < lastPage ? link(currentPage + 1) : null,
    previousPageUrl: currentPage > 1 ? link(currentPage - 1) : null,
  }

  return HttpResponse.json({
    data: items.slice((currentPage - 1) * perPage, currentPage * perPage),
    metadata,
  })
}

export const contactMocks = [
  http.get('*/api/v1/workspace/contacts', ({ request }) => {
    const query = new URL(request.url).searchParams
    const refused = unauthorized()
    if (refused) return refused
    if (query.has('status')) {
      return failure(422, 'VALIDATION_ERROR', [invalid('status', 'array')])
    }

    const statuses = query.getAll('status[]')
    if (statuses.some((status) => !STATUSES.includes(status))) {
      return failure(422, 'VALIDATION_ERROR', [invalid('status', 'enum')])
    }

    const matching = mine()
      .filter((item) => statuses.length === 0 || statuses.includes(item.status))
      .sort((a, b) => b.id - a.id)

    return page(matching, query)
  }),
  http.post<never, PostApiV1WorkspaceContactsBody>(
    '*/api/v1/workspace/contacts',
    async ({ request }) => {
      const refused = unauthorized()
      if (refused) return refused
      if (!manager()) return failure(403, 'AUTHORIZATION_FAILURE')

      const body = await request.json()
      const details: Detail[] = []
      const phone = blankToNull(body.phone)
      const waId = typeof phone === 'string' ? toWaId(phone) : null
      if (phone === null || phone === undefined) details.push(invalid('phone', 'required'))
      else if (!waId) details.push(invalid('phone', 'waId'))
      else if (taken(waId)) details.push(invalid('phone', 'unique', 'database.unique'))
      const name = checkName(blankToNull(body.name), details)
      if (details.length || !waId) return failure(422, 'VALIDATION_ERROR', details)

      const created = {
        ...contact(nextId++, waId, name ?? null, null, 'active'),
        createdAt: ago(0),
      }
      mine().push(created)

      return HttpResponse.json({ data: created }, { status: 201 })
    }
  ),
  http.patch<{ contact: string }, PatchApiV1WorkspaceContactsContactIdBody>(
    '*/api/v1/workspace/contacts/:contact',
    async ({ params, request }) => {
      const refused = unauthorized()
      if (refused) return refused

      const found = find(params.contact)
      if (!found) return failure(404, 'ROW_NOT_FOUND')
      if (!manager()) return failure(403, 'AUTHORIZATION_FAILURE')

      const body = await request.json()
      const details: Detail[] = []
      const name = checkName(blankToNull(body.name), details)
      if (body.status !== undefined && !STATUSES.includes(body.status)) {
        details.push(invalid('status', 'enum'))
      }
      if (details.length) return failure(422, 'VALIDATION_ERROR', details)

      if (name !== undefined) found.name = name
      if (body.status !== undefined) found.status = body.status

      return HttpResponse.json({ data: found })
    }
  ),
  http.delete<{ contact: string }>('*/api/v1/workspace/contacts/:contact', ({ params }) => {
    const refused = unauthorized()
    if (refused) return refused

    const found = find(params.contact)
    if (!found) return failure(404, 'ROW_NOT_FOUND')
    if (!manager()) return failure(403, 'AUTHORIZATION_FAILURE')

    mine().splice(mine().indexOf(found), 1)

    return new HttpResponse(null, { status: 204 })
  }),
]
