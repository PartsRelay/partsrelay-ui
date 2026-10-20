import { setupWorker } from 'msw/browser'
import * as apiMocks from '@/core/api/endpoints/index.msw'
import { authMocks } from '@/core/mocks/auth'

const generated = Object.values(apiMocks).flatMap((mock) => mock())

// The stateful Better Auth mocks first, then the generated core API ones
export const worker = setupWorker(...authMocks, ...generated)
