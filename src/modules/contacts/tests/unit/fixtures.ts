import { AxiosError, AxiosHeaders } from 'axios'
import type { ContactObject, GetApiV1WorkspaceContacts200 } from '@/core/api/models'
import { permissionsFor } from '@/modules/workspaces/core/permissions'
import type { Role } from '@/modules/workspaces/core/role'
import type { Me } from '@/modules/workspaces/core/workspace'

export function meAs(role: Role): Me {
  return {
    member: {
      id: '1',
      userId: '101',
      role,
      name: 'Mark Reed',
      email: 'mark.reed@redwoodparts.com',
      image: null,
      joinedAt: new Date(2026, 0, 12),
    },
    role,
    permissions: permissionsFor(role),
  }
}

export function contactFixture(id: number, overrides: Partial<ContactObject> = {}): ContactObject {
  return {
    id,
    waId: '447700900123',
    name: null,
    profileName: `Contact ${id}`,
    status: 'active',
    createdAt: new Date(2026, 2, 12, 9).toISOString(),
    lookupsCount: 0,
    monthLookupsCount: 0,
    lastLookupAt: null,
    ...overrides,
  }
}

export function pageFixture(
  data: ContactObject[],
  page = 1,
  perPage = 20,
  total = data.length
): GetApiV1WorkspaceContacts200 {
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

// The flat error body of the core
export function coreError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() }
  const response = { status, statusText: '', headers: {}, config, data: { code, status } }

  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
}
