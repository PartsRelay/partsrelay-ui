import { QueryCache, QueryClient } from '@tanstack/react-query'
import { failureNotice } from '@/modules/auth/core/session.query'
import { errorStatus, NO_STATUS } from '@/core/errors'
import { notify } from '@/core/notify'

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: { silent?: boolean }
  }
}

export function reportError(error: unknown, silent?: boolean) {
  const notice = failureNotice(queryClient, error, silent)
  if (!notice) return

  notify('danger', ...notice)
}

function retryable(error: Error) {
  const status = errorStatus(error)

  return status === NO_STATUS || status >= 500
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportError(error, query.meta?.silent),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) => retryable(error) && failures < 2,
    },
    mutations: { retry: false },
  },
})
