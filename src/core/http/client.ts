import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

export type ErrorType<E> = AxiosError<E>
export type BodyType<B> = B

const instance = axios.create({ headers: { accept: 'application/json' }, withCredentials: true })

export function configureHttp(baseUrl: string) {
  instance.defaults.baseURL = baseUrl
}

export function http<T>(request: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return instance<T>({ ...request, ...options }).then(({ data }) => data)
}
