import { env } from '@/env'

export const mocksEnabled = import.meta.env.DEV && env.APP_ENV === 'development'
