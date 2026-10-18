import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { failureNotice } from '@/modules/core/auth/session.query'
import { errorStatus } from '@/modules/core/shared/errors'
import { resolveNotice } from '@/modules/core/shared/notice'
import { translate } from '@/ui/providers/i18n'

function notify(error: Error, silent?: boolean) {
  const notice = failureNotice(queryClient, error, silent)
  if (notice) toast.error(translate(notice), { id: notice.key })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => notify(error, query.meta?.silent),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _result, mutation) => notify(error, mutation.meta?.silent),
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
