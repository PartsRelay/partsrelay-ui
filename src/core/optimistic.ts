import type { MutationFunctionContext, QueryKey } from '@tanstack/query-core'

export type Snapshot<TData> = Array<[QueryKey, TData | undefined]>

export function optimistic<TData, TVariables>(
  queryKey: QueryKey,
  update: (data: TData, variables: TVariables, key: QueryKey) => TData
) {
  return {
    onMutate: async (variables: TVariables, { client }: MutationFunctionContext) => {
      await client.cancelQueries({ queryKey })
      const snapshot = client.getQueriesData<TData>({ queryKey })

      for (const [key, data] of snapshot) {
        if (data !== undefined) client.setQueryData<TData>(key, update(data, variables, key))
      }

      return snapshot
    },
    onError: (
      _error: Error,
      _variables: TVariables,
      snapshot: Snapshot<TData> | undefined,
      { client }: MutationFunctionContext
    ) => {
      for (const [key, data] of snapshot ?? []) client.setQueryData(key, data)
    },
    onSettled: (
      _data: unknown,
      _error: Error | null,
      _variables: TVariables,
      _snapshot: Snapshot<TData> | undefined,
      { client }: MutationFunctionContext
    ) => client.invalidateQueries({ queryKey }),
  }
}
