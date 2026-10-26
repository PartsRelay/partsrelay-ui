import { z } from 'zod'
import {
  type ContactObject,
  type GetApiV1WorkspaceLookupsParams,
  LookupObjectSource,
  LookupObjectStatus,
  SearcherType,
} from '@/core/api/models'
import { type Message, message } from '@/core/message'
import { contactName } from '@/modules/contacts/core/contact-row'
import { textKey } from '@/modules/lookups/core/lookup-row'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export const EVERYONE = 'everyone'

export const ALL = 'all'

const PERIODS = [7, 30, 90] as const

export const lookupIdSchema = z.coerce.number().int().positive()

const optionalText = z.string().optional().catch(undefined)

const requesterSchema = z.object({
  searcherType: z.enum(SearcherType).optional().catch(undefined),
  searcherId: z.number().int().positive().optional().catch(undefined),
})

const filtersSchema = requesterSchema.extend({
  search: optionalText,
  status: z.enum(LookupObjectStatus).optional().catch(undefined),
  source: z.enum(LookupObjectSource).optional().catch(undefined),
  days: z.literal(PERIODS).optional().catch(undefined),
})

export const lookupsSearchSchema = filtersSchema.extend({
  page: z.number().int().min(1).default(1).catch(1),
  new: z.boolean().optional().catch(undefined),
  plate: optionalText,
  vin: optionalText,
  query: optionalText,
})

export type LookupsSearch = z.infer<typeof lookupsSearchSchema>

export type LookupFilters = z.infer<typeof filtersSchema>

export type Requester = z.infer<typeof requesterSchema>

export type RequesterOption = { value: string; label: string }

export type FilterOption = { value: string; label: Message }

const option = (value: string, label: Message): FilterOption => ({ value, label })

const all = (key: string) => option(ALL, message(key))

export const filterOptions = {
  status: [
    all('lookups.filter.all'),
    ...Object.values(LookupObjectStatus).map((status) =>
      option(status, message(`lookups.status.${textKey(status)}`))
    ),
  ],
  source: [
    all('lookups.filter.all'),
    ...Object.values(LookupObjectSource).map((source) =>
      option(source, message(`lookups.source.${source}`))
    ),
  ],
  days: [
    all('lookups.filter.all-time'),
    ...PERIODS.map((days) => option(String(days), message('lookups.filter.days', { days }))),
  ],
}

export const filterValues = {
  status: (value: string) => Object.values(LookupObjectStatus).find((item) => item === value),
  source: (value: string) => Object.values(LookupObjectSource).find((item) => item === value),
  days: (value: string) => PERIODS.find((item) => String(item) === value),
}

export function filtered(search: LookupFilters) {
  return filtersSchema.keyof().options.some((key) => search[key] !== undefined)
}

export function lookupListParams({
  page,
  searcherType,
  searcherId,
  search,
  status,
  source,
  days,
}: LookupsSearch): GetApiV1WorkspaceLookupsParams {
  const requester = searcherType && searcherId ? { searcherType, searcherId } : {}

  return { page, ...requester, search, status, source, days }
}

export function requesterValue({ searcherType, searcherId }: Requester) {
  return searcherType && searcherId ? `${searcherType}:${searcherId}` : EVERYONE
}

export function requesterSearch(value: string): Requester {
  const [searcherType, searcherId] = value.split(':')
  const requester = requesterSchema.parse({ searcherType, searcherId: Number(searcherId) })

  return requester.searcherType && requester.searcherId
    ? requester
    : { searcherType: undefined, searcherId: undefined }
}

const byLabel = (a: RequesterOption, b: RequesterOption) => a.label.localeCompare(b.label)

export function requesterOptions(workspace: Workspace, contacts: ContactObject[]) {
  return {
    members: workspace.members
      .map((member) => ({
        value: requesterValue({ searcherType: 'user', searcherId: Number(member.userId) }),
        label: member.name,
      }))
      .sort(byLabel),
    contacts: contacts
      .map((contact) => ({
        value: requesterValue({ searcherType: 'contact', searcherId: contact.id }),
        label: contactName(contact),
      }))
      .sort(byLabel),
  }
}
