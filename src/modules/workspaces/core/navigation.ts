import { message } from '@/core/message'
import type { Permissions } from '@/modules/workspaces/core/permissions'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export const sections = ['searches', 'contacts', 'team', 'company'] as const
export const pages = [...sections, 'profile'] as const
export type Section = (typeof sections)[number]
export type Page = (typeof pages)[number]
export const pagePaths = {
  searches: '/searches',
  contacts: '/contacts',
  team: '/workspace',
  company: '/company',
  profile: '/profile',
} as const satisfies Record<Page, string>
export type CrumbId = Page
export function pageAt(pathname: string): Page | null {
  return (
    pages.find(
      (page) => pathname === pagePaths[page] || pathname.startsWith(pagePaths[page] + '/')
    ) ?? null
  )
}
export function canOpen(page: Page | null, permissions: Permissions) {
  if (page === 'team') return permissions.viewTeam
  if (page === 'company') return permissions.viewCompany
  return true
}
export function homePath(_permissions?: Permissions) {
  return pagePaths.searches
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
  return [
    message(id === 'profile' ? 'crumbs.account' : 'crumbs.workspace'),
    message(`crumbs.${id}`),
  ]
}
export function ownerOf(workspace: Workspace) {
  return workspace.members.find((member) => member.role === 'owner') ?? null
}
