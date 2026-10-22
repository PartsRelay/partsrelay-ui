import { setupWorker } from 'msw/browser'
import * as apiMocks from '@/core/api/endpoints/index.msw'
import { authMocks } from '@/core/mocks/auth'
import { contactMocks } from '@/core/mocks/contacts'
import { lookupMocks } from '@/core/mocks/lookups'

const generated = Object.values(apiMocks).flatMap((mock) => mock())

// The stateful mocks first, then the generated core API ones
export const worker = setupWorker(...authMocks, ...contactMocks, ...lookupMocks, ...generated)
