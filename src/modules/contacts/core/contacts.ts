import { z } from 'zod'
import { ContactStatus } from '@/core/api/models'

export const contactTabs = ['all', ...Object.values(ContactStatus)] as const

export type ContactTab = (typeof contactTabs)[number]

export const contactsSearchSchema = z.object({
  status: z.enum(ContactStatus).optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})

export type ContactsSearch = z.infer<typeof contactsSearchSchema>

export function tabStatus(tab: string): ContactStatus | undefined {
  return Object.values(ContactStatus).find((status) => status === tab)
}
