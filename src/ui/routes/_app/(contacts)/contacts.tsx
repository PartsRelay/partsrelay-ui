import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { pageHead } from '@/core/head'
import { contactsSearchSchema } from '@/modules/contacts/core/contacts'
import { ContactsPage } from '@/modules/contacts/ui/contacts-page'

export const Route = createFileRoute('/_app/(contacts)/contacts')({
  validateSearch: contactsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  staticData: { crumb: 'contacts' },
  head: pageHead('contacts.title'),
  component: ContactsPage,
})
