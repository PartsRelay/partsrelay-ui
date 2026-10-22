import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { failureNotice } from '@/modules/auth/core/session.query'
import { NewSearch } from '@/modules/searches/ui/new-search'

const harness = vi.hoisted(() => ({
  values: { plate: '', query: '' },
  formOptions: undefined as
    | {
        onSubmit: (context: {
          value: { plate: string; query: string }
          formApi: { reset: () => void }
        }) => Promise<void>
      }
    | undefined,
  reset: vi.fn(),
  refs: [] as { current: unknown }[],
  refIndex: 0,
  mutationOptions: undefined as { retry?: boolean } | undefined,
  mutateAsync: vi.fn(),
  invalidateQueries: vi.fn(),
  navigate: vi.fn(),
  close: vi.fn(),
  isError: false,
  error: undefined as unknown,
}))
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useRef: (initial: unknown) => {
    const index = harness.refIndex++
    return (harness.refs[index] ??= { current: initial })
  },
}))
vi.mock('@/form', () => ({
  useAppForm: (options: NonNullable<typeof harness.formOptions>) => {
    harness.formOptions = options
    return { AppForm: 'section', Form: 'form', AppField: () => null, SubmitButton: 'button' }
  },
}))
vi.mock('@tanstack/react-query', async (original) => ({
  ...(await original<typeof import('@tanstack/react-query')>()),
  useMutation: (options: { retry?: boolean }) => {
    harness.mutationOptions = options
    return {
      mutateAsync: harness.mutateAsync,
      reset: vi.fn(),
      isPending: false,
      isError: harness.isError,
      error: harness.error,
    }
  },
  useQueryClient: () => ({ invalidateQueries: harness.invalidateQueries }),
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => harness.navigate }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/modules/workspaces/ui/hooks/use-me', () => ({
  useMe: () => ({ me: { member: { name: 'Owner' } }, workspace: { id: 'company-a' } }),
}))
vi.mock('@/modules/auth/core/session.query', () => ({ failureNotice: vi.fn() }))
vi.mock('@/core/http/client', () => ({ http: vi.fn() }))

type Element = ReactElement<{
  children?: ReactNode
  onClick?: () => void
}>
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement(node)) return []
  const element = node as Element
  return [element, ...elements(element.props.children)]
}
function render() {
  harness.refIndex = 0
  return elements(NewSearch({ open: true, onOpenChange: harness.close }))
}
function submit() {
  return harness.formOptions!.onSubmit({
    value: harness.values,
    formApi: { reset: harness.reset },
  })
}
function text(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(text).join(' ')
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children)
  return ''
}

beforeEach(() => {
  vi.clearAllMocks()
  harness.values = { plate: 'GH482KL', query: 'front brake pads' }
  harness.reset.mockImplementation(() => {
    harness.values = { plate: '', query: '' }
  })
  harness.refs = []
  harness.isError = false
  harness.error = undefined
  harness.invalidateQueries.mockResolvedValue(undefined)
  harness.navigate.mockResolvedValue(undefined)
})

describe('new search submission', () => {
  it('blocks duplicate submissions and opens the accepted result without waiting for history', async () => {
    let accept: (result: { id: number }) => void = () => undefined
    harness.mutateAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          accept = resolve
        })
    )
    harness.invalidateQueries.mockImplementationOnce(() => new Promise(() => undefined))
    render()
    const pending = submit()
    await submit()
    expect(harness.mutateAsync).toHaveBeenCalledOnce()
    expect(harness.mutationOptions?.retry).toBe(false)
    accept({ id: 17 })
    await pending
    expect(harness.navigate).toHaveBeenCalledWith({
      to: '/searches/$searchId',
      params: { searchId: '17' },
    })
    expect(harness.close).toHaveBeenCalledWith(false)
    expect(harness.reset).toHaveBeenCalledOnce()
    expect(harness.values).toEqual({ plate: '', query: '' })
  })

  it('handles failed authentication without discarding form inputs or resending', async () => {
    const error = { status: 401, error: { code: 'UNAUTHORIZED_ACCESS', status: 401 } }
    harness.mutateAsync.mockRejectedValueOnce(error)
    render()
    await submit()
    expect(failureNotice).toHaveBeenCalledWith(expect.anything(), error, true)
    expect(harness.mutateAsync).toHaveBeenCalledOnce()
    expect(harness.navigate).not.toHaveBeenCalled()
    expect(harness.reset).not.toHaveBeenCalled()
    expect(harness.values).toEqual({ plate: 'GH482KL', query: 'front brake pads' })
  })

  it('does not start a search with invalid inputs', async () => {
    harness.values = { plate: 'ABC', query: ' ' }
    render()
    await submit()
    expect(harness.mutateAsync).not.toHaveBeenCalled()
    expect(harness.navigate).not.toHaveBeenCalled()
  })

  it.each([
    new TypeError('Connection lost'),
    { status: 503, error: { code: 'INTERNAL_SERVER_ERROR' } },
  ])('offers a history check for an ambiguous response', (error) => {
    harness.isError = true
    harness.error = error
    const tree = render()
    expect(
      tree.some((node) => text(node.props.children).includes('searches.new.acceptance-unknown'))
    ).toBe(true)
    const check = tree.find((node) => text(node.props.children) === 'searches.new.check-queue')!
    check.props.onClick!()
    expect(harness.close).toHaveBeenCalledWith(false)
    expect(harness.navigate).toHaveBeenCalledWith({
      to: '/searches',
      search: { page: 1, requester: 'all' },
    })
    expect(harness.mutateAsync).not.toHaveBeenCalled()
  })

  it.each([401, 403, 422])(
    'does not describe an explicit %i rejection as uncertain acceptance',
    (status) => {
      harness.isError = true
      harness.error = { status, error: { code: 'VALIDATION_ERROR' } }
      expect(
        render().some((node) =>
          text(node.props.children).includes('searches.new.acceptance-unknown')
        )
      ).toBe(false)
    }
  )
})
