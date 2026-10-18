import { AxiosError, AxiosHeaders } from 'axios'

export function axiosError(status?: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() }
  const response =
    status === undefined
      ? undefined
      : { status, statusText: '', headers: {}, config, data: data ?? {} }

  return new AxiosError('failed', 'ERR', config, null, response)
}

export function authError(status: number, code?: string) {
  return { status, statusText: '', error: code ? { code, message: code } : { message: 'failed' } }
}
