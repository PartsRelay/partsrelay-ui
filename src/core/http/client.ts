import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/env'

export type ErrorType<E> = AxiosError<E>
export type BodyType<B> = B

const instance = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { accept: 'application/json' },
  withCredentials: true,
})

export function http<T>(request: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return instance<T>({ ...request, ...options }).then(({ data }) => data)
}
