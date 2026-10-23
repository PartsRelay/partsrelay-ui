import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MessageValues } from '@/core/message'
import { reportError } from '@/query-client'
import { notify } from '@/core/notify'

type ActionOptions = {
  notice?: string
  values?: MessageValues
  // A function picks the errors the caller shows itself
  silent?: boolean | ((error: unknown) => boolean)
}

type Action = ActionOptions & { action: () => Promise<unknown> }

export type ActionResult = { ok: true } | { ok: false; error: unknown }

export function useBetterAuthAction() {
  const client = useQueryClient()
  const { isPending, error, mutateAsync } = useMutation({
    mutationFn: ({ action }: Action) => action(),
    networkMode: 'always',
    onSuccess: (_data, { notice, values }) => {
      if (notice) notify('success', notice, values)
    },
    onError: (failure, { silent }) =>
      reportError(failure, typeof silent === 'function' ? silent(failure) : silent),
  })

  const run = (action: () => Promise<unknown>, options: ActionOptions = {}) =>
    mutateAsync({ ...options, action }).then(
      (): ActionResult => ({ ok: true }),
      (failure: unknown): ActionResult => ({ ok: false, error: failure })
    )

  return { client, pending: isPending, error, run }
}
