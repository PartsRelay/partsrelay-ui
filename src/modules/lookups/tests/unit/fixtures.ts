import type { GetApiV1WorkspaceLookups200, LookupObject } from '@/core/api/models'
import type { Role } from '@/modules/workspaces/core/role'
import type { Member, Workspace } from '@/modules/workspaces/core/workspace'

function memberFixture(id: number, role: Role, name: string): Member {
  return {
    id: String(id),
    userId: String(100 + id),
    role,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@redwoodparts.com`,
    image: null,
    joinedAt: new Date(2026, 0, 12),
  }
}

export function workspaceFixture(): Workspace {
  return {
    id: '1',
    name: 'Redwood Parts',
    locale: 'en-US',
    setup: 'done',
    metadata: { setup: 'done' },
    members: [
      memberFixture(1, 'owner', 'Mark Reed'),
      memberFixture(2, 'admin', 'Julia White'),
      memberFixture(3, 'viewer', 'Luke Ford'),
    ],
    invitations: [],
  }
}

export function lookupFixture(id: number, overrides: Partial<LookupObject> = {}): LookupObject {
  return {
    id,
    plate: 'AB12CDE',
    vin: 'WF0FXXGCDFKA12345',
    nodeIds: ['g1'],
    status: 'done',
    source: 'web',
    searcher: { type: 'user', id: 101, name: 'Mark Reed' },
    vehicleDescription: 'Ford Fiesta 1.0',
    categories: [
      {
        id: 'g1',
        name: 'Oil filter',
        units: [
          {
            code: 'u1',
            name: 'Engine oil filter',
            imageUrl: 'https://images.example/u1.jpg',
            original: [
              {
                code: '2116445',
                name: 'Oil filter',
                price: null,
                aftermarket: [
                  { code: 'W 7015', brand: 'MANN-FILTER', description: 'Oil filter', price: null },
                  { code: 'F 026 407 209', brand: 'BOSCH', description: null, price: null },
                ],
              },
            ],
          },
        ],
      },
    ],
    createdAt: new Date(2026, 9, 12, 9, 59).toISOString(),
    ...overrides,
  }
}

export function pageFixture(
  data: LookupObject[],
  page = 1,
  perPage = 20,
  total = data.length
): GetApiV1WorkspaceLookups200 {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const link = (target: number) => `/?page=${target}`

  return {
    data,
    metadata: {
      total,
      perPage,
      currentPage: page,
      lastPage,
      firstPage: 1,
      firstPageUrl: link(1),
      lastPageUrl: link(lastPage),
      previousPageUrl: page > 1 ? link(page - 1) : null,
      nextPageUrl: page < lastPage ? link(page + 1) : null,
    },
  }
}
