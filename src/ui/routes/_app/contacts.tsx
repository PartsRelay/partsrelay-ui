import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { contactsSearchSchema } from '@/modules/contacts/core/contacts'
import { ContactDirectory } from '@/modules/contacts/ui/contact-directory'

export const Route = createFileRoute('/_app/contacts')({
  validateSearch: contactsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  staticData: { crumb: 'contacts' },
  component: ContactDirectory,
})
