import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostApiV1LookupsBody } from '@/core/api/models'
import { fieldErrors } from '@/core/errors'
import { lookupFieldErrors } from '@/modules/lookups/core/lookup-form'
import { startLookup } from '@/modules/lookups/core/lookups.mutation'
import { reportError } from '@/query-client'

export function useStartLookup() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (lookup: PostApiV1LookupsBody) => startLookup(client, lookup),
    onError: (error) => reportError(error, fieldErrors(error, lookupFieldErrors) !== null),
  })
}
