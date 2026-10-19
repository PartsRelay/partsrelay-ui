import { setupWorker } from 'msw/browser'
import * as restApiMocks from '@/core/api/rest/endpoints/index.msw'
import { authMocks } from '@/core/mocks/auth'

const generated = Object.values(restApiMocks).flatMap((mock) => mock())

// The stateful Better Auth mocks first, then the generated REST ones
export const worker = setupWorker(...authMocks, ...generated)
