import { setupWorker } from 'msw/browser'
import * as mocks from '@/ui/api/endpoints/index.msw'
import { authMocks } from '@/ui/mocks/auth'

export const worker = setupWorker(...authMocks, ...Object.values(mocks).flatMap((mock) => mock()))
