import { MutationObserver } from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { sessionQuery } from '@/modules/auth/core/session.query'
import { message } from '@/core/message'
import { authError } from '@/core/testing/fixtures'
import { notify } from '@/ui/components/notify'
import { queryClient } from '@/query-client'

vi.mock('@/ui/components/notify', () => ({ notify: vi.fn() }))

vi.mock('@/modules/auth/core/auth.client', () => ({ authClient: {} }))

const signedIn = { user: { id: '101', email: 'marco@ricambirossi.it' } }

function failQuery(error: unknown, silent?: boolean) {
  return queryClient
    .fetchQuery({ queryKey: ['failing'], queryFn: () => Promise.reject(error), meta: { silent } })
    .catch(() => null)
}

function failMutation(error: unknown, silent?: boolean) {
  return new MutationObserver(queryClient, {
    mutationFn: () => Promise.reject(error),
    meta: { silent },
  })
    .mutate()
    .catch(() => null)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient.clear()
  queryClient.setQueryData(sessionQuery.queryKey, signedIn)
})

describe('query client', () => {
  it('ends the session from a silent query without a toast', async () => {
    await failQuery(authError(401, 'UNAUTHORIZED'), true)

    expect(queryClient.getQueryData(sessionQuery.queryKey)).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('ends the session when Better Auth sends no code', async () => {
    await failMutation({ status: 401, statusText: '', error: { message: 'User not found' } })

    expect(queryClient.getQueryData(sessionQuery.queryKey)).toBeNull()
    expect(notify).toHaveBeenCalledWith('error', message('errors.UNAUTHORIZED_ACCESS'), {
      id: 'errors.UNAUTHORIZED_ACCESS',
    })
  })

  it('ends the session from a silent mutation', async () => {
    await failMutation({ status: 401, statusText: '', error: '' }, true)

    expect(queryClient.getQueryData(sessionQuery.queryKey)).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('keeps the session on a refused removal', async () => {
    await failMutation(authError(401, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER'))

    expect(queryClient.getQueryData(sessionQuery.queryKey)).toEqual(signedIn)
    expect(notify).toHaveBeenCalledWith(
      'error',
      message('errors.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER'),
      { id: 'errors.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER' }
    )
  })
})
