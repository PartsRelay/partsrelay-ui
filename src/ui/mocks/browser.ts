import { setupWorker } from 'msw/browser'
import * as mocks from '@/ui/api/endpoints/index.msw'
import { authMocks } from '@/ui/mocks/auth'
import { contactMocks } from '@/ui/mocks/contacts'

export const worker = setupWorker(
  ...authMocks,
  ...contactMocks,
  ...Object.values(mocks).flatMap((mock) => mock())
)
