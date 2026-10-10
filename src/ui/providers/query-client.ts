import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { i18n } from '@/ui/providers/i18n'

type ApiError = { error?: { code?: string } }

function shouldRetry(failures: number, error: Error) {
  const clientError = isAxiosError(error) && (error.response?.status ?? 500) < 500

  return !clientError && failures < 2
}

function errorCode(error: Error) {
  if (!isAxiosError<ApiError>(error)) return 'UNKNOWN'
  if (!error.response) return 'NETWORK_ERROR'

  return error.response.data?.error?.code ?? 'UNKNOWN'
}

function notify(error: Error) {
  const key = `errors.${errorCode(error)}`

  toast.error(i18n.t(i18n.exists(key) ? key : 'errors.UNKNOWN'), { id: key })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: notify }),
  mutationCache: new MutationCache({ onError: notify }),
  defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry } },
})
