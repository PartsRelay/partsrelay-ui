import { setupWorker } from 'msw/browser'
import * as authApiMocks from '@/core/api/auth/endpoints/index.msw'
import * as restApiMocks from '@/core/api/rest/endpoints/index.msw'
import { authMocks } from '@/ui/mocks/auth'

const generated = [...Object.values(authApiMocks), ...Object.values(restApiMocks)]

export const worker = setupWorker(...authMocks, ...generated.flatMap((mock) => mock()))
