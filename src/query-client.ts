import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { failureNotice } from '@/modules/auth/core/session.query'
import { errorStatus, NO_STATUS, toErrorBody } from '@/core/errors'
import { resolveNotice } from '@/core/notice'
import { notify } from '@/ui/components/notify'

function report(error: Error, silent?: boolean) {
  const notice = failureNotice(queryClient, error, silent)
  // The message exists only in development
  if (notice) notify('error', notice, { id: notice.key, description: toErrorBody(error).message })
}

function retryable(error: Error) {
  const status = errorStatus(error)

  return status === NO_STATUS || status >= 500
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
      retry: (failures, error) => retryable(error) && failures < 2,
    },
  },
})
