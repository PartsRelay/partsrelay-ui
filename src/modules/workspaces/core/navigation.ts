import { message } from '@/core/message'
import type { Permissions } from '@/modules/workspaces/core/permissions'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export const sections = ['searches', 'contacts', 'workspace', 'company'] as const

export const pages = [...sections, 'profile'] as const

export type Section = (typeof sections)[number]

export type Page = (typeof pages)[number]

export const pagePaths = {
  searches: '/searches',
  contacts: '/contacts',
  workspace: '/workspace',
  company: '/company',
  profile: '/profile',
} as const satisfies Record<Page, string>

export type CrumbId = 'searches' | 'search' | 'contacts' | 'workspace' | 'company' | 'profile'

const CRUMB_PARENTS = {
  searches: null,
  search: 'searches',
  contacts: null,
  workspace: null,
  company: 'workspace',
  profile: 'account',
} as const satisfies Record<CrumbId, string | null>

function within(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function pageAt(pathname: string): Page | null {
  return pages.find((page) => within(pathname, pagePaths[page])) ?? null
}

export function canOpen(page: Page | null, permissions: Permissions) {
  if (page === 'workspace') return permissions.viewWorkspace
  if (page === 'company') return permissions.viewCompany

  return true
}

export function homePath(permissions: Permissions) {
  const home = sections.find((page) => canOpen(page, permissions))

  return home ? pagePaths[home] : pagePaths.profile
}

export function navigation(permissions: Permissions, current: Page | null) {
  return sections
    .filter((page) => canOpen(page, permissions))
    .map((page) => ({
      page,
      path: pagePaths[page],
      label: message(`nav.${page}`),
      active: page === current,
    }))
}

export function breadcrumbs(id: CrumbId) {
  const parent = CRUMB_PARENTS[id]

  return parent ? [message(`crumbs.${parent}`), message(`crumbs.${id}`)] : [message(`crumbs.${id}`)]
}

export function ownerOf(workspace: Workspace) {
  return workspace.members.find((member) => member.role === 'owner') ?? null
}
