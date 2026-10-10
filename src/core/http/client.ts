import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

export type HttpConfig = {
  baseUrl: string
  getToken: () => string | null
  onUnauthorized?: () => void
}

export type ErrorType<E> = AxiosError<E>
export type BodyType<B> = B

let config: HttpConfig = { baseUrl: '', getToken: () => null }

const instance = axios.create({ headers: { accept: 'application/json' } })

instance.interceptors.request.use((request) => {
  const token = config.getToken()

  if (token) request.headers.set('authorization', `Bearer ${token}`)

  return request
})

instance.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) config.onUnauthorized?.()

  return Promise.reject(error)
})

export function configureHttp(next: Partial<HttpConfig>) {
  config = { ...config, ...next }
  instance.defaults.baseURL = config.baseUrl
}

export function http<T>(request: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return instance<T>({ ...request, ...options }).then(({ data }) => data)
}
