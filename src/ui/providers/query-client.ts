import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sessionQuery } from '@/modules/core/auth/session.query'
import { errorNotice, errorStatus, sessionEnded } from '@/modules/core/shared/errors'
import { resolveNotice } from '@/modules/core/shared/notice'
import { translate } from '@/ui/providers/i18n'

function notify(error: Error) {
  const notice = errorNotice(error, Boolean(queryClient.getQueryData(sessionQuery.queryKey)))
  if (sessionEnded(error)) queryClient.setQueryData(sessionQuery.queryKey, null)
  if (notice) toast.error(translate(notice), { id: notice.key })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.silent) notify(error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _result, mutation) => {
      if (!mutation.meta?.silent) notify(error)
    },
    onSuccess: (data, variables, _result, mutation) => {
      const notice = resolveNotice(mutation.meta, variables, data)
      if (notice) toast.success(translate(notice))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) => (errorStatus(error) ?? 500) >= 500 && failures < 2,
    },
  },
})
