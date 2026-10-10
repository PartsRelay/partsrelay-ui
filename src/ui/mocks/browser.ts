import { setupWorker } from 'msw/browser'
import * as mocks from '@/ui/api/endpoints/index.msw'

export const worker = setupWorker(...Object.values(mocks).flatMap((mock) => mock()))
