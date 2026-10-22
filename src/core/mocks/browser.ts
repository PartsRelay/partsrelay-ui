import { setupWorker } from 'msw/browser'
import { authMocks } from '@/core/mocks/auth'
import { businessMocks } from '@/core/mocks/business'

// Auth handlers first; unmatched preview API calls fail locally.
export const worker = setupWorker(...authMocks, ...businessMocks)
