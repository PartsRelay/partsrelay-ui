import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { i18n } from '@/i18n'

export type ErrorType<E> = AxiosError<E>
export type BodyType<B> = B

const instance = axios.create({
  baseURL: env.API_URL,
  headers: { accept: 'application/json' },
  withCredentials: true,
})

// The core answers in the app language
instance.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', i18n.language)
  return config
})

export function http<T>(request: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return instance<T>({ ...request, ...options, withCredentials: true }).then(({ data }) => data)
}
