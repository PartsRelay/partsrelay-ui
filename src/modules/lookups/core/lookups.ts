import { z } from 'zod'
import { type ContactObject, SearcherType } from '@/core/api/models'
import { contactName } from '@/modules/contacts/core/contact-row'
import type { LookupListParams } from '@/modules/lookups/core/lookups.query'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export const EVERYONE = 'everyone'

export const lookupIdSchema = z.coerce.number().int().positive()

const requesterSchema = z.object({
  searcherType: z.enum(SearcherType).optional().catch(undefined),
  searcherId: z.number().int().positive().optional().catch(undefined),
})

export const lookupsSearchSchema = requesterSchema.extend({
  page: z.number().int().min(1).default(1).catch(1),
  new: z.boolean().optional().catch(undefined),
  plate: z.string().optional().catch(undefined),
})

export type LookupsSearch = z.infer<typeof lookupsSearchSchema>

export type Requester = z.infer<typeof requesterSchema>

export type RequesterOption = { value: string; label: string }

export function lookupListParams({
  page,
  searcherType,
  searcherId,
}: LookupsSearch): LookupListParams {
  return searcherType && searcherId ? { page, searcherType, searcherId } : { page }
}

export function requesterValue({ searcherType, searcherId }: Requester) {
  return searcherType && searcherId ? `${searcherType}:${searcherId}` : EVERYONE
}

export function requesterSearch(value: string): Requester {
  const [searcherType, searcherId] = value.split(':')
  const requester = requesterSchema.parse({ searcherType, searcherId: Number(searcherId) })

  return requester.searcherType && requester.searcherId ? requester : {}
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
