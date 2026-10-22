import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContactObject } from '@/core/api/models'
import { notify } from '@/core/notify'
import { contactName } from '@/modules/contacts/core/contact-row'
import { removeContact } from '@/modules/contacts/core/contacts.mutation'
import { reportError } from '@/query-client'

export function useRemoveContact() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (contact: ContactObject) => removeContact(client, contact),
    onSuccess: (_data, contact) =>
      notify('success', 'contacts.notices.removed', { name: contactName(contact) }),
    onError: (error) => reportError(error),
  })
}
