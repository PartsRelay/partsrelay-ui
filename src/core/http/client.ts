import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { i18n } from '@/i18n'
import { authToken } from '@/modules/auth/core/auth-token'

export type ErrorType<E> = AxiosError<E>
export type BodyType<B> = B

const instance = axios.create({
  baseURL: env.API_URL,
  headers: { accept: 'application/json' },
})

instance.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', i18n.language)
  const authorization = authToken.header()
  if (authorization) config.headers.set('Authorization', authorization)
  return config
})

export function http<T>(request: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return instance<T>({ ...request, ...options }).then(({ data }) => data)
}
