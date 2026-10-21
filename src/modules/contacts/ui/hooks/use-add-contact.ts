import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import { notify } from '@/core/notify'
import { phoneError } from '@/modules/contacts/core/contact-form'
import { addContact } from '@/modules/contacts/core/contacts.mutation'
import { contactName } from '@/modules/contacts/core/contact-row'
import { reportError } from '@/query-client'

export function useAddContact() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (contact: PostApiV1WorkspaceContactsBody) => addContact(client, contact),
    onSuccess: (contact) =>
      notify('success', 'contacts.notices.added', { name: contactName(contact) }),
    // The form shows the phone errors itself
    onError: (error) => reportError(error, phoneError(error) !== null),
  })
}
