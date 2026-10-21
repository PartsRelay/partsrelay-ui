import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContactObject } from '@/core/api/models'
import { notify } from '@/core/notify'
import {
  type ContactChange,
  changeNotice,
  updateContact,
} from '@/modules/contacts/core/contacts.mutation'
import { reportError } from '@/query-client'

type Update = { contact: ContactObject; change: ContactChange }

// Notifies even when the row leaves the list first
export function useUpdateContact() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ contact, change }: Update) => updateContact(client, contact, change),
    onSuccess: (_data, { contact, change }) => notify('success', ...changeNotice(contact, change)),
    onError: (error) => reportError(error),
  })
}
