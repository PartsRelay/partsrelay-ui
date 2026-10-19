import type { Message } from '@/core/message'

type NoticeFn = (variables: never, data: never) => Message | null

export type NoticeMeta = { notice?: Message | NoticeFn; silent?: boolean }

declare module '@tanstack/query-core' {
  interface Register {
    mutationMeta: NoticeMeta
    queryMeta: { silent?: boolean }
  }
}

export function resolveNotice(meta: NoticeMeta | undefined, variables: unknown, data: unknown) {
  const notice = meta?.notice
  if (typeof notice !== 'function') return notice ?? null

  return (notice as (variables: unknown, data: unknown) => Message | null)(variables, data)
}
