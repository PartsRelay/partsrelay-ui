import { setupWorker } from 'msw/browser'
import * as apiMocks from '@/core/api/endpoints/index.msw'
import { authMocks } from '@/mocks/auth'
import { contactMocks } from '@/mocks/contacts'

const generated = Object.values(apiMocks).flatMap((mock) => mock())

// The stateful mocks first, then the generated core API ones
export const worker = setupWorker(...authMocks, ...contactMocks, ...generated)
