import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { failureNotice } from '@/modules/auth/core/session.query'
import { errorStatus, toAppError } from '@/core/errors'
import { resolveNotice } from '@/core/notice'
import { notify } from '@/ui/components/notify'

// Only development shows the message of the core
function detail(error: Error) {
  return import.meta.env.DEV ? (toAppError(error).message ?? undefined) : undefined
}

function report(error: Error, silent?: boolean) {
  const notice = failureNotice(queryClient, error, silent)
  if (notice) notify('error', notice, { id: notice.key, description: detail(error) })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => report(error, query.meta?.silent),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _result, mutation) => report(error, mutation.meta?.silent),
    onSuccess: (data, variables, _result, mutation) => {
      const notice = resolveNotice(mutation.meta, variables, data)
      if (notice) notify('success', notice)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) => (errorStatus(error) ?? 500) >= 500 && failures < 2,
    },
  },
})
