import { env } from '@/env'

// Development runs on the MSW mocks, staging and production on the core
export const mocksEnabled = import.meta.env.DEV && env.APP_ENV === 'development'
