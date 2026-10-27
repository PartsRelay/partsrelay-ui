import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostApiV1WorkspaceContactsBody } from '@/core/api/models'
import { notify } from '@/core/notify'
import { fieldErrors } from '@/core/errors'
import { contactFieldErrors } from '@/modules/contacts/core/contact-form'
import { addContact } from '@/modules/contacts/core/contacts.mutation'
import { contactName } from '@/modules/contacts/core/contact-row'
import { reportError } from '@/query-client'

export function useAddContact() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (contact: PostApiV1WorkspaceContactsBody) => addContact(client, contact),
    onSuccess: (contact) =>
      notify('success', 'contacts.notices.added', { name: contactName(contact) }),
    onError: (error) => reportError(error, fieldErrors(error, contactFieldErrors) !== null),
  })
}
